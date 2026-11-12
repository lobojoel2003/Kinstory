// Words that appear in the printed book, by language. Only the book's own
// furniture is translated here; the stories are printed as told.

export interface BookLabels {
	contents: string;
	chapter: string;
	part: string;
	askedBy: string;
	listen: string;
	questions: string;
	questionsIntro: string;
	afterword: string;
	typeNote: string;
	toldByPhone: string;
	toldByVoiceNote: string;
	toldInPerson: string;
	madeWith: string;
	firstPrinting: string;
}

const en: BookLabels = {
	contents: 'Contents',
	chapter: 'Chapter',
	part: 'Part',
	askedBy: 'asked by',
	listen: 'Scan to hear this story in the storyteller’s own voice.',
	questions: 'The Questions',
	questionsIntro: 'Every story in this book began with a question from someone who wanted to know.',
	afterword: 'Afterword',
	typeNote: 'A note on the type',
	toldByPhone: 'Told by telephone',
	toldByVoiceNote: 'Recorded as a voice note',
	toldInPerson: 'Recorded',
	madeWith: 'Made with Kinstory, free and open-source software for keeping family stories.',
	firstPrinting: 'First printing'
};

const es: BookLabels = {
	contents: 'Índice',
	chapter: 'Capítulo',
	part: 'Parte',
	askedBy: 'preguntó',
	listen: 'Escanea para escuchar esta historia con la voz de quien la contó.',
	questions: 'Las preguntas',
	questionsIntro: 'Cada historia de este libro empezó con la pregunta de alguien que quería saber.',
	afterword: 'Epílogo',
	typeNote: 'Nota sobre la tipografía',
	toldByPhone: 'Contado por teléfono',
	toldByVoiceNote: 'Grabado como nota de voz',
	toldInPerson: 'Grabado',
	madeWith: 'Hecho con Kinstory, software libre para guardar las historias de la familia.',
	firstPrinting: 'Primera impresión'
};

const fr: BookLabels = {
	contents: 'Sommaire',
	chapter: 'Chapitre',
	part: 'Partie',
	askedBy: 'question de',
	listen: 'Scannez pour écouter cette histoire de la voix de celle ou celui qui l’a racontée.',
	questions: 'Les questions',
	questionsIntro:
		'Chaque histoire de ce livre a commencé par la question de quelqu’un qui voulait savoir.',
	afterword: 'Postface',
	typeNote: 'Note sur les caractères',
	toldByPhone: 'Raconté au téléphone',
	toldByVoiceNote: 'Enregistré en message vocal',
	toldInPerson: 'Enregistré',
	madeWith: 'Réalisé avec Kinstory, logiciel libre pour garder les histoires de famille.',
	firstPrinting: 'Premier tirage'
};

const de: BookLabels = {
	contents: 'Inhalt',
	chapter: 'Kapitel',
	part: 'Teil',
	askedBy: 'gefragt von',
	listen: 'Scannen, um diese Geschichte in der Stimme der Erzählerin oder des Erzählers zu hören.',
	questions: 'Die Fragen',
	questionsIntro:
		'Jede Geschichte in diesem Buch begann mit der Frage von jemandem, der es wissen wollte.',
	afterword: 'Nachwort',
	typeNote: 'Zur Schrift',
	toldByPhone: 'Am Telefon erzählt',
	toldByVoiceNote: 'Als Sprachnachricht aufgenommen',
	toldInPerson: 'Aufgenommen',
	madeWith: 'Gemacht mit Kinstory, freier Software für Familiengeschichten.',
	firstPrinting: 'Erste Auflage'
};

const it: BookLabels = {
	contents: 'Indice',
	chapter: 'Capitolo',
	part: 'Parte',
	askedBy: 'domanda di',
	listen: 'Inquadra per ascoltare questa storia dalla voce di chi l’ha raccontata.',
	questions: 'Le domande',
	questionsIntro: 'Ogni storia di questo libro è nata dalla domanda di qualcuno che voleva sapere.',
	afterword: 'Postfazione',
	typeNote: 'Nota sui caratteri',
	toldByPhone: 'Raccontato al telefono',
	toldByVoiceNote: 'Registrato come messaggio vocale',
	toldInPerson: 'Registrato',
	madeWith: 'Realizzato con Kinstory, software libero per custodire le storie di famiglia.',
	firstPrinting: 'Prima edizione'
};

const pt: BookLabels = {
	contents: 'Sumário',
	chapter: 'Capítulo',
	part: 'Parte',
	askedBy: 'pergunta de',
	listen: 'Leia o código para ouvir esta história na voz de quem a contou.',
	questions: 'As perguntas',
	questionsIntro: 'Cada história deste livro começou com a pergunta de alguém que queria saber.',
	afterword: 'Posfácio',
	typeNote: 'Nota sobre a tipografia',
	toldByPhone: 'Contado por telefone',
	toldByVoiceNote: 'Gravado como mensagem de voz',
	toldInPerson: 'Gravado',
	madeWith: 'Feito com Kinstory, software livre para guardar as histórias da família.',
	firstPrinting: 'Primeira impressão'
};

const nl: BookLabels = {
	contents: 'Inhoud',
	chapter: 'Hoofdstuk',
	part: 'Deel',
	askedBy: 'gevraagd door',
	listen: 'Scan om dit verhaal te horen in de stem van wie het vertelde.',
	questions: 'De vragen',
	questionsIntro: 'Elk verhaal in dit boek begon met een vraag van iemand die het wilde weten.',
	afterword: 'Nawoord',
	typeNote: 'Over de letter',
	toldByPhone: 'Telefonisch verteld',
	toldByVoiceNote: 'Opgenomen als spraakbericht',
	toldInPerson: 'Opgenomen',
	madeWith: 'Gemaakt met Kinstory, vrije software voor familieverhalen.',
	firstPrinting: 'Eerste druk'
};

export const BOOK_LABELS: Record<string, BookLabels> = { en, es, fr, de, it, pt, nl };

export function labelsFor(lang: string): BookLabels {
	return BOOK_LABELS[lang] ?? en;
}

export const TYPE_NOTES: Record<string, string> = {
	heirloom:
		'This book is set in EB Garamond, Georg Duffner and Octavio Pardo’s revival of the types cut by Claude Garamond in sixteenth-century Paris, with titles in Cormorant Garamond by Christian Thalmann. It was typeset with Typst.',
	caslon:
		'This book is set in Libre Caslon, Pablo Impallari’s revival of the types of William Caslon, the eighteenth-century London founder whose letters were used to print the first copies of the American Declaration of Independence. It was typeset with Typst.',
	modern:
		'This book is set in Newsreader, designed by Production Type for long reading, with labels in Inter by Rasmus Andersson. It was typeset with Typst.'
};
