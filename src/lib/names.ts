// How to address a storyteller. The book prints the full name ("Rosa
// Delgado"), but the phone and the answer page should sound like family:
// "Hello Rosa", or "Hello Grandma Rosa" when that is how they were entered.

const KIN =
	/^(grand(ma|pa|mother|father|mum|mom|dad)|gran|granny|grandad|nana|nan|nanna|nonna|nonno|abuela|abuelo|abuelita|abuelito|oma|opa|omi|opi|bubbe|bubby|zayde|zaidy|babcia|dziadek|babushka|dedushka|mamie|papy|papi|mémé|pépé|vovó|vovô|avó|avô|lola|lolo|aunt|auntie|aunty|uncle|tia|tía|tio|tío|mom|mum|mother|dad|father|mama|papa|ma|pa)$/i;

export function shortName(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length <= 1) return parts[0] ?? '';
	if (KIN.test(parts[0])) return parts.slice(0, 2).join(' ');
	return parts[0];
}

/** "Daniel", "Daniel and Lucía", "Daniel, Lucía and Maya", without repeats. */
export function joinNames(names: string[], and = 'and'): string {
	const seen = new Set<string>();
	const unique: string[] = [];
	for (const n of names.map((x) => shortName(x)).filter(Boolean)) {
		if (!seen.has(n.toLowerCase())) {
			seen.add(n.toLowerCase());
			unique.push(n);
		}
	}
	if (unique.length <= 1) return unique[0] ?? '';
	return `${unique.slice(0, -1).join(', ')} ${and} ${unique.at(-1)}`;
}
