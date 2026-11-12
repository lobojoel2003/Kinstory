// Row shapes shared by the server and the pages it feeds. Column names are
// camelCased by the database client.

import type {
	BleedMode,
	CoverColor,
	LanguageId,
	PaperId,
	PhotoLayout,
	ThemeId,
	TrimId
} from './book-options.ts';

export type Role = 'owner' | 'editor';

export interface User {
	id: string;
	email: string;
	name: string;
	createdAt: Date;
}

export interface Project {
	id: string;
	title: string;
	subtitle: string | null;
	imprint: string | null;
	dedication: string | null;
	afterword: string | null;
	blurb: string | null;
	language: LanguageId;
	createdBy: string | null;
	createdAt: Date;
	updatedAt: Date;
	trim: TrimId;
	theme: ThemeId;
	color: boolean;
	bleedMode: BleedMode;
	paper: PaperId;
	dropCaps: boolean;
	chapterNumbers: boolean;
	questionsIndex: boolean;
	listenQr: boolean;
	coverColor: CoverColor;
	coverPhotoId: string | null;
	frontispiecePhotoId: string | null;
	frontispieceCaption: string | null;
}

export interface ProjectSummary extends Project {
	role: Role;
	storytellerNames: string | null;
	storyCount: number;
	minutes: number;
	coverPreview: string | null;
}

export type Delivery = 'none' | 'call' | 'sms' | 'email';

export interface Storyteller {
	id: string;
	projectId: string;
	name: string;
	phone: string | null;
	email: string | null;
	pin: string;
	answerToken: string;
	delivery: Delivery;
	timezone: string;
	callDay: number | null;
	callTime: string | null;
	lastPromptedAt: Date | null;
	createdAt: Date;
}

export type PromptStatus = 'queued' | 'sent' | 'answered' | 'skipped';

export interface Prompt {
	id: string;
	projectId: string;
	storytellerId: string | null;
	text: string;
	askedBy: string | null;
	position: number;
	status: PromptStatus;
	sentAt: Date | null;
	answeredAt: Date | null;
	createdAt: Date;
}

export type RecordingSource = 'web' | 'phone' | 'upload';
export type RecordingStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface Segment {
	start: number;
	end: number;
	text: string;
}

export interface Recording {
	id: string;
	projectId: string;
	storytellerId: string | null;
	promptId: string | null;
	storyId: string | null;
	source: RecordingSource;
	fileKey: string;
	mime: string | null;
	bytes: number | null;
	durationSeconds: number | null;
	status: RecordingStatus;
	transcript: string | null;
	segments: Segment[] | null;
	language: string | null;
	error: string | null;
	externalId: string | null;
	createdAt: Date;
}

export interface Story {
	id: string;
	projectId: string;
	storytellerId: string | null;
	promptId: string | null;
	title: string;
	question: string | null;
	askedBy: string | null;
	body: string;
	pullQuote: string | null;
	part: string | null;
	position: number;
	includeInBook: boolean;
	status: 'draft' | 'ready';
	recordedAt: Date | null;
	recordedVia: RecordingSource | null;
	shareToken: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface StoryListItem extends Story {
	words: number;
	seconds: number;
	photoCount: number;
	pending: number;
}

export interface Photo {
	id: string;
	projectId: string;
	storyId: string | null;
	fileKey: string;
	width: number;
	height: number;
	caption: string | null;
	layout: PhotoLayout;
	anchor: number | null;
	position: number;
	createdAt: Date;
}

export interface Render {
	id: string;
	projectId: string;
	status: 'pending' | 'running' | 'done' | 'failed';
	dirKey: string | null;
	pages: number | null;
	spineInches: number | null;
	settings: Record<string, unknown>;
	error: string | null;
	requestedBy: string | null;
	createdAt: Date;
	finishedAt: Date | null;
}

export interface Member {
	userId: string;
	name: string;
	email: string;
	role: Role;
	createdAt: Date;
}
