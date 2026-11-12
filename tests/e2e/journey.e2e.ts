import { join } from 'node:path';
import { devices, expect, test } from '@playwright/test';

const VOICE_NOTE = join(import.meta.dirname, '..', 'fixtures', 'voice-note.ogg');

test('the landing page explains Kinstory and shows the book', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('in a book you can hold');
	await expect(page.getByRole('link', { name: 'Start a book' }).first()).toBeVisible();
	await expect(page.locator('img[src="/showcase/cover.webp"]')).toBeVisible();
});

test('a wrong password gets a clear message', async ({ page }) => {
	await page.goto('/login');
	await page.fill('#email', 'nobody@example.com');
	await page.fill('#password', 'not-the-password');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByRole('alert')).toContainText('don’t match an account');
});

test('from sign-up to a typeset book', async ({ page, browser, request }) => {
	const email = `maya+${Date.now()}@example.com`;

	// Sign up and start a book.
	await page.goto('/signup');
	await page.fill('#name', 'Maya');
	await page.fill('#email', email);
	await page.fill('#password', 'a-very-long-password');
	await page.getByRole('button', { name: 'Create account' }).click();
	await page.waitForURL('**/projects/new');
	await page.fill('#storyteller', 'Nell Hartley');
	await page.fill('#title', 'Nell’s Kitchen Table');
	await page.getByRole('button', { name: /Create book/ }).click();
	await page.waitForURL(/\/p\/[0-9a-f-]+\?welcome=1$/);
	await expect(page.getByText('Your book is set up, with nine questions waiting.')).toBeVisible();
	const projectUrl = page.url().replace('?welcome=1', '');
	const question = await page.locator('.week .q').first().innerText();
	const answerLink = await page.locator('.link code').first().innerText();

	// Nell answers from her phone, with no account and nothing to install.
	const phone = await browser.newContext({ ...devices['Pixel 7'] });
	const nell = await phone.newPage();
	await nell.goto(answerLink);
	await expect(nell.getByText('Hello, Nell')).toBeVisible();
	await expect(nell.getByRole('heading', { level: 1 })).toHaveText(question);
	await expect(nell.getByRole('button', { name: 'Tap to start talking' })).toBeVisible();
	await nell.setInputFiles('input[type=file]', VOICE_NOTE);
	await expect(nell.getByText('Thank you! Your family will love this.')).toBeVisible();
	await phone.close();

	// The answer is transcribed into a story.
	await page.goto(projectUrl);
	await expect(async () => {
		await page.reload();
		await expect(page.locator('.answers li').first()).toContainText('Transcribed', {
			timeout: 1000
		});
	}).toPass({ timeout: 45_000 });
	await page.locator('.answers li a').first().click();
	await page.waitForURL(/stories\/[0-9a-f-]+$/);
	await expect(page.locator('textarea#body')).toHaveValue(/Well, let me think about that\./);
	await expect(page.locator('textarea#body')).not.toHaveValue(/\bum\b/);

	// A light edit.
	await page.fill('input.title', 'The House by the Water');
	await page.getByRole('button', { name: 'Save story' }).click();
	await expect(page.getByText('Saved', { exact: true })).toBeVisible();

	// Typeset and download the book.
	await page.goto(`${projectUrl}/book`);
	await page.getByRole('button', { name: /Save & typeset/ }).click();
	const interior = page.getByRole('link', { name: 'Interior PDF' });
	await expect(interior).toBeVisible({ timeout: 60_000 });
	await expect(page.getByRole('img', { name: 'Page 1' })).toBeVisible();

	const pdf = await page.request.get((await interior.getAttribute('href'))!);
	expect(pdf.status()).toBe(200);
	expect(pdf.headers()['content-type']).toBe('application/pdf');
	expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');

	const health = await request.get('/api/health');
	expect(await health.json()).toMatchObject({ status: 'ok', database: 'ok' });
});
