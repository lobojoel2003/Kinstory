-- Kinstory schema, version 1.
-- Migrations run automatically at startup, in file-name order, each in its
-- own transaction. Never edit a released migration: add a new file.

create table users (
	id uuid primary key default gen_random_uuid(),
	email text not null,
	name text not null,
	password_hash text not null,
	created_at timestamptz not null default now()
);
create unique index users_email_key on users (lower(email));

create table sessions (
	id text primary key, -- sha256 of the cookie token; the token itself is never stored
	user_id uuid not null references users (id) on delete cascade,
	expires_at timestamptz not null,
	created_at timestamptz not null default now()
);
create index sessions_user_idx on sessions (user_id);

-- A project is one book: the stories of one storyteller (or a couple).
create table projects (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	subtitle text,
	imprint text,
	dedication text,
	afterword text,
	blurb text,
	language text not null default 'en',
	created_by uuid references users (id) on delete set null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),

	-- Book design
	trim text not null default '6x9',
	theme text not null default 'heirloom',
	color boolean not null default true,
	bleed_mode text not null default 'none',
	paper text not null default 'cream',
	drop_caps boolean not null default true,
	chapter_numbers boolean not null default true,
	questions_index boolean not null default true,
	listen_qr boolean not null default false,
	cover_color text not null default 'oxblood',
	cover_photo_id uuid,
	frontispiece_photo_id uuid,
	frontispiece_caption text
);

create table project_members (
	project_id uuid not null references projects (id) on delete cascade,
	user_id uuid not null references users (id) on delete cascade,
	role text not null check (role in ('owner', 'editor')),
	created_at timestamptz not null default now(),
	primary key (project_id, user_id)
);
create index project_members_user_idx on project_members (user_id);

create table invites (
	token_hash text primary key,
	project_id uuid not null references projects (id) on delete cascade,
	role text not null default 'editor' check (role in ('owner', 'editor')),
	created_by uuid references users (id) on delete set null,
	created_at timestamptz not null default now(),
	expires_at timestamptz not null,
	used_at timestamptz,
	used_by uuid references users (id) on delete set null
);

-- The elder. Storytellers never log in: they answer through a private link,
-- or by phone, recognised by caller ID or a six-digit code.
create table storytellers (
	id uuid primary key default gen_random_uuid(),
	project_id uuid not null references projects (id) on delete cascade,
	name text not null,
	phone text,
	email text,
	pin text not null,
	answer_token text not null,
	delivery text not null default 'none' check (delivery in ('none', 'call', 'sms', 'email')),
	timezone text not null default 'UTC',
	call_day smallint check (call_day between 0 and 6),
	call_time text check (call_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
	last_prompted_at timestamptz,
	created_at timestamptz not null default now()
);
create unique index storytellers_answer_token_key on storytellers (answer_token);
create unique index storytellers_pin_key on storytellers (pin);
create unique index storytellers_phone_key on storytellers (phone) where phone is not null;
create index storytellers_project_idx on storytellers (project_id);

create table prompts (
	id uuid primary key default gen_random_uuid(),
	project_id uuid not null references projects (id) on delete cascade,
	storyteller_id uuid references storytellers (id) on delete cascade,
	text text not null,
	asked_by text,
	position integer not null default 0,
	status text not null default 'queued' check (status in ('queued', 'sent', 'answered', 'skipped')),
	sent_at timestamptz,
	answered_at timestamptz,
	created_at timestamptz not null default now()
);
create index prompts_project_idx on prompts (project_id, status, position);

create table stories (
	id uuid primary key default gen_random_uuid(),
	project_id uuid not null references projects (id) on delete cascade,
	storyteller_id uuid references storytellers (id) on delete set null,
	prompt_id uuid references prompts (id) on delete set null,
	title text not null,
	question text,
	asked_by text,
	body text not null default '',
	pull_quote text,
	part text,
	position integer not null default 0,
	include_in_book boolean not null default true,
	status text not null default 'draft' check (status in ('draft', 'ready')),
	recorded_at timestamptz,
	recorded_via text check (recorded_via in ('phone', 'web', 'upload')),
	share_token text not null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);
create unique index stories_share_token_key on stories (share_token);
create index stories_project_idx on stories (project_id, position);

create table recordings (
	id uuid primary key default gen_random_uuid(),
	project_id uuid not null references projects (id) on delete cascade,
	storyteller_id uuid references storytellers (id) on delete set null,
	prompt_id uuid references prompts (id) on delete set null,
	story_id uuid references stories (id) on delete set null,
	source text not null check (source in ('web', 'phone', 'upload')),
	file_key text not null,
	mime text,
	bytes bigint,
	duration_seconds real,
	status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
	transcript text,
	segments jsonb,
	language text,
	error text,
	external_id text,
	created_at timestamptz not null default now()
);
create unique index recordings_external_key on recordings (external_id) where external_id is not null;
create index recordings_project_idx on recordings (project_id, created_at desc);
create index recordings_story_idx on recordings (story_id);

create table photos (
	id uuid primary key default gen_random_uuid(),
	project_id uuid not null references projects (id) on delete cascade,
	story_id uuid references stories (id) on delete set null,
	file_key text not null,
	width integer not null,
	height integer not null,
	caption text,
	layout text not null default 'full' check (layout in ('full', 'inset', 'pair', 'plate')),
	anchor integer,
	position integer not null default 0,
	created_at timestamptz not null default now()
);
create index photos_project_idx on photos (project_id);
create index photos_story_idx on photos (story_id, position);

alter table projects
	add constraint projects_cover_photo_fkey foreign key (cover_photo_id) references photos (id) on delete set null,
	add constraint projects_frontispiece_photo_fkey foreign key (frontispiece_photo_id) references photos (id) on delete set null;

create table renders (
	id uuid primary key default gen_random_uuid(),
	project_id uuid not null references projects (id) on delete cascade,
	status text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
	dir_key text,
	pages integer,
	spine_inches real,
	settings jsonb not null default '{}',
	error text,
	requested_by uuid references users (id) on delete set null,
	created_at timestamptz not null default now(),
	finished_at timestamptz
);
create index renders_project_idx on renders (project_id, created_at desc);

-- A small, durable job queue: workers claim rows with FOR UPDATE SKIP LOCKED,
-- so several Kinstory processes can share one database safely.
create table jobs (
	id bigserial primary key,
	kind text not null,
	payload jsonb not null default '{}',
	status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
	attempts integer not null default 0,
	max_attempts integer not null default 3,
	run_at timestamptz not null default now(),
	locked_at timestamptz,
	last_error text,
	created_at timestamptz not null default now(),
	finished_at timestamptz
);
create index jobs_ready_idx on jobs (run_at) where status = 'queued';
