import nodemailer, { type Transporter } from 'nodemailer';
import { config } from './config.ts';

let transport: Transporter | null = null;

export async function sendMail(m: { to: string; subject: string; text: string }): Promise<void> {
	const c = config();
	if (!c.SMTP_URL) throw new Error('SMTP_URL is not configured');
	transport ??= nodemailer.createTransport(c.SMTP_URL);
	await transport.sendMail({ from: c.MAIL_FROM, to: m.to, subject: m.subject, text: m.text });
}
