// Structured one-line logs: JSON in production (easy to ship anywhere),
// readable text in development.

type Level = 'debug' | 'info' | 'warn' | 'error';
const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function threshold(): number {
	const l = (process.env.LOG_LEVEL ?? 'info').toLowerCase() as Level;
	return order[l] ?? order.info;
}

function emit(level: Level, msg: string, fields: Record<string, unknown> = {}) {
	if (order[level] < threshold()) return;
	if (process.env.NODE_ENV === 'test' && level !== 'error' && !process.env.LOG_LEVEL) return;
	const err =
		fields.err instanceof Error ? { err: fields.err.message, stack: fields.err.stack } : {};
	const record = { t: new Date().toISOString(), level, msg, ...fields, ...err };
	const line =
		process.env.LOG_FORMAT === 'pretty' ||
		(process.env.NODE_ENV !== 'production' && process.stdout.isTTY)
			? `${record.t.slice(11, 19)} ${level.toUpperCase().padEnd(5)} ${msg} ${Object.entries({
					...fields,
					...err
				})
					.filter(([k]) => k !== 'stack')
					.map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
					.join(' ')}`
			: JSON.stringify(record);
	(level === 'error' || level === 'warn' ? console.error : console.log)(line);
}

export const log = {
	debug: (msg: string, f?: Record<string, unknown>) => emit('debug', msg, f),
	info: (msg: string, f?: Record<string, unknown>) => emit('info', msg, f),
	warn: (msg: string, f?: Record<string, unknown>) => emit('warn', msg, f),
	error: (msg: string, f?: Record<string, unknown>) => emit('error', msg, f)
};
