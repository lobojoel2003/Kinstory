// Words the storyteller hears on the phone and reads on their answer page.
// Elders often speak a different first language from their grandchildren,
// so these follow the book's language rather than the organiser's.

export interface ElderStrings {
	// Phone
	hello: (name: string) => string;
	thisWeek: (asker: string | null) => string;
	takeYourTime: string;
	noQuestion: string;
	thanks: (name: string) => string;
	enterCode: string;
	codeWrong: string;
	voicemail: (name: string, number: string) => string;
	didNotHear: string;
	// Web
	greeting: (name: string) => string;
	questionFrom: (asker: string) => string;
	record: string;
	stop: string;
	listen: string;
	again: string;
	send: string;
	sending: string;
	sent: string;
	sentMore: string;
	anotherQuestion: string;
	anyStory: string;
	upload: string;
	micBlocked: string;
	orCall: (number: string, pin: string) => string;
	recording: string;
	failed: string;
}

const en: ElderStrings = {
	hello: (n) => `Hello ${n}.`,
	thisWeek: (a) =>
		a
			? `This is Kinstory, with this week's question from ${a}.`
			: `This is Kinstory, with this week's question.`,
	takeYourTime:
		'Take all the time you need. After the tone, tell your story. When you are finished, press the pound key, or simply hang up.',
	noQuestion:
		'There is no question waiting this week, but you can tell any story you like after the tone.',
	thanks: (n) => `Thank you, ${n}. Your family will treasure this. Goodbye.`,
	enterCode: 'Welcome to Kinstory. Please enter your six digit code.',
	codeWrong:
		'Sorry, that code did not match. Please check the card from your family and call again. Goodbye.',
	voicemail: (n, num) =>
		`Hello ${n}, this is Kinstory with this week's question from your family. Call ${num} any time to answer. Goodbye.`,
	didNotHear: 'Sorry, we did not hear anything. Goodbye.',
	greeting: (n) => `Hello, ${n}`,
	questionFrom: (a) => `A question from ${a}`,
	record: 'Tap to start talking',
	stop: 'Tap when you are finished',
	listen: 'Listen back',
	again: 'Start again',
	send: 'Send to my family',
	sending: 'Sending…',
	sent: 'Thank you! Your family will love this.',
	sentMore: 'Answer another question',
	anotherQuestion: 'Choose a different question',
	anyStory: 'Tell any story you like',
	upload: 'Or send a recording you already made',
	micBlocked:
		'The microphone is turned off for this page. Allow it in your browser settings, or call instead.',
	orCall: (num, pin) => `Prefer the phone? Call ${num} and enter ${pin}.`,
	recording: 'Recording',
	failed: 'That did not send. Please try again.'
};

const es: ElderStrings = {
	hello: (n) => `Hola ${n}.`,
	thisWeek: (a) =>
		a
			? `Le llama Kinstory con la pregunta de esta semana, de parte de ${a}.`
			: `Le llama Kinstory con la pregunta de esta semana.`,
	takeYourTime:
		'Tómese todo el tiempo que necesite. Después del tono, cuente su historia. Cuando termine, pulse la tecla almohadilla o simplemente cuelgue.',
	noQuestion:
		'Esta semana no hay ninguna pregunta pendiente, pero después del tono puede contar la historia que quiera.',
	thanks: (n) => `Gracias, ${n}. Su familia lo guardará como un tesoro. Adiós.`,
	enterCode: 'Bienvenido a Kinstory. Por favor, marque su código de seis dígitos.',
	codeWrong:
		'Lo sentimos, el código no coincide. Revise la tarjeta de su familia y vuelva a llamar. Adiós.',
	voicemail: (n, num) =>
		`Hola ${n}, le llama Kinstory con la pregunta de esta semana de su familia. Llame al ${num} cuando quiera para responder. Adiós.`,
	didNotHear: 'Lo sentimos, no hemos oído nada. Adiós.',
	greeting: (n) => `Hola, ${n}`,
	questionFrom: (a) => `Una pregunta de ${a}`,
	record: 'Toque para empezar a hablar',
	stop: 'Toque cuando termine',
	listen: 'Escuchar',
	again: 'Empezar de nuevo',
	send: 'Enviar a mi familia',
	sending: 'Enviando…',
	sent: '¡Gracias! A su familia le va a encantar.',
	sentMore: 'Responder otra pregunta',
	anotherQuestion: 'Elegir otra pregunta',
	anyStory: 'Contar la historia que quiera',
	upload: 'O enviar una grabación que ya tenga',
	micBlocked:
		'El micrófono está desactivado para esta página. Actívelo en el navegador o llame por teléfono.',
	orCall: (num, pin) => `¿Prefiere el teléfono? Llame al ${num} y marque ${pin}.`,
	recording: 'Grabando',
	failed: 'No se pudo enviar. Inténtelo de nuevo.'
};

const fr: ElderStrings = {
	hello: (n) => `Bonjour ${n}.`,
	thisWeek: (a) =>
		a
			? `Ici Kinstory, avec la question de la semaine, de la part de ${a}.`
			: `Ici Kinstory, avec la question de la semaine.`,
	takeYourTime:
		'Prenez tout votre temps. Après le bip, racontez votre histoire. Quand vous avez terminé, appuyez sur la touche dièse, ou raccrochez simplement.',
	noQuestion:
		'Aucune question n’attend cette semaine, mais vous pouvez raconter l’histoire de votre choix après le bip.',
	thanks: (n) => `Merci, ${n}. Votre famille va adorer. Au revoir.`,
	enterCode: 'Bienvenue sur Kinstory. Veuillez composer votre code à six chiffres.',
	codeWrong:
		'Désolé, ce code ne correspond pas. Vérifiez la carte de votre famille et rappelez. Au revoir.',
	voicemail: (n, num) =>
		`Bonjour ${n}, ici Kinstory avec la question de la semaine de votre famille. Appelez le ${num} quand vous voulez pour répondre. Au revoir.`,
	didNotHear: 'Désolé, nous n’avons rien entendu. Au revoir.',
	greeting: (n) => `Bonjour, ${n}`,
	questionFrom: (a) => `Une question de ${a}`,
	record: 'Touchez pour commencer à parler',
	stop: 'Touchez quand vous avez fini',
	listen: 'Réécouter',
	again: 'Recommencer',
	send: 'Envoyer à ma famille',
	sending: 'Envoi…',
	sent: 'Merci ! Votre famille va adorer.',
	sentMore: 'Répondre à une autre question',
	anotherQuestion: 'Choisir une autre question',
	anyStory: 'Raconter l’histoire de votre choix',
	upload: 'Ou envoyer un enregistrement déjà fait',
	micBlocked:
		'Le micro est désactivé pour cette page. Autorisez-le dans le navigateur, ou appelez plutôt.',
	orCall: (num, pin) => `Vous préférez le téléphone ? Appelez le ${num} et composez ${pin}.`,
	recording: 'Enregistrement',
	failed: 'L’envoi a échoué. Veuillez réessayer.'
};

const de: ElderStrings = {
	hello: (n) => `Hallo ${n}.`,
	thisWeek: (a) =>
		a
			? `Hier ist Kinstory mit der Frage der Woche von ${a}.`
			: `Hier ist Kinstory mit der Frage der Woche.`,
	takeYourTime:
		'Lassen Sie sich alle Zeit, die Sie brauchen. Erzählen Sie nach dem Ton Ihre Geschichte. Wenn Sie fertig sind, drücken Sie die Rautetaste oder legen Sie einfach auf.',
	noQuestion:
		'Diese Woche wartet keine Frage, aber nach dem Ton können Sie jede Geschichte erzählen, die Sie möchten.',
	thanks: (n) => `Danke, ${n}. Ihre Familie wird sich sehr freuen. Auf Wiederhören.`,
	enterCode: 'Willkommen bei Kinstory. Bitte geben Sie Ihren sechsstelligen Code ein.',
	codeWrong:
		'Leider passt der Code nicht. Bitte prüfen Sie die Karte Ihrer Familie und rufen Sie erneut an. Auf Wiederhören.',
	voicemail: (n, num) =>
		`Hallo ${n}, hier ist Kinstory mit der Frage der Woche von Ihrer Familie. Rufen Sie jederzeit ${num} an, um zu antworten. Auf Wiederhören.`,
	didNotHear: 'Leider haben wir nichts gehört. Auf Wiederhören.',
	greeting: (n) => `Hallo, ${n}`,
	questionFrom: (a) => `Eine Frage von ${a}`,
	record: 'Tippen und losreden',
	stop: 'Tippen, wenn Sie fertig sind',
	listen: 'Anhören',
	again: 'Neu beginnen',
	send: 'An meine Familie senden',
	sending: 'Wird gesendet…',
	sent: 'Danke! Ihre Familie wird sich freuen.',
	sentMore: 'Eine weitere Frage beantworten',
	anotherQuestion: 'Eine andere Frage wählen',
	anyStory: 'Eine beliebige Geschichte erzählen',
	upload: 'Oder eine vorhandene Aufnahme senden',
	micBlocked:
		'Das Mikrofon ist für diese Seite ausgeschaltet. Erlauben Sie es im Browser oder rufen Sie stattdessen an.',
	orCall: (num, pin) => `Lieber telefonieren? Rufen Sie ${num} an und geben Sie ${pin} ein.`,
	recording: 'Aufnahme läuft',
	failed: 'Das hat nicht geklappt. Bitte versuchen Sie es noch einmal.'
};

const it: ElderStrings = {
	hello: (n) => `Ciao ${n}.`,
	thisWeek: (a) =>
		a
			? `Qui è Kinstory, con la domanda della settimana da parte di ${a}.`
			: `Qui è Kinstory, con la domanda della settimana.`,
	takeYourTime:
		'Prenditi tutto il tempo che ti serve. Dopo il segnale, racconta la tua storia. Quando hai finito, premi il tasto cancelletto o riaggancia.',
	noQuestion:
		'Questa settimana non c’è nessuna domanda in attesa, ma dopo il segnale puoi raccontare la storia che preferisci.',
	thanks: (n) => `Grazie, ${n}. La tua famiglia lo custodirà come un tesoro. Arrivederci.`,
	enterCode: 'Benvenuto su Kinstory. Digita il tuo codice di sei cifre.',
	codeWrong:
		'Spiacenti, il codice non corrisponde. Controlla il biglietto della tua famiglia e richiama. Arrivederci.',
	voicemail: (n, num) =>
		`Ciao ${n}, qui è Kinstory con la domanda della settimana dalla tua famiglia. Chiama il ${num} quando vuoi per rispondere. Arrivederci.`,
	didNotHear: 'Spiacenti, non abbiamo sentito nulla. Arrivederci.',
	greeting: (n) => `Ciao, ${n}`,
	questionFrom: (a) => `Una domanda da ${a}`,
	record: 'Tocca per iniziare a parlare',
	stop: 'Tocca quando hai finito',
	listen: 'Riascolta',
	again: 'Ricomincia',
	send: 'Invia alla mia famiglia',
	sending: 'Invio…',
	sent: 'Grazie! Alla tua famiglia piacerà moltissimo.',
	sentMore: 'Rispondi a un’altra domanda',
	anotherQuestion: 'Scegli un’altra domanda',
	anyStory: 'Racconta la storia che preferisci',
	upload: 'Oppure invia una registrazione già fatta',
	micBlocked:
		'Il microfono è disattivato per questa pagina. Consentilo nelle impostazioni del browser oppure telefona.',
	orCall: (num, pin) => `Preferisci il telefono? Chiama il ${num} e digita ${pin}.`,
	recording: 'Registrazione',
	failed: 'Invio non riuscito. Riprova.'
};

const pt: ElderStrings = {
	hello: (n) => `Olá ${n}.`,
	thisWeek: (a) =>
		a
			? `Aqui é a Kinstory, com a pergunta da semana de ${a}.`
			: `Aqui é a Kinstory, com a pergunta da semana.`,
	takeYourTime:
		'Leve o tempo que precisar. Depois do sinal, conte a sua história. Quando terminar, pressione a tecla cerquilha ou simplesmente desligue.',
	noQuestion:
		'Não há nenhuma pergunta esta semana, mas depois do sinal pode contar a história que quiser.',
	thanks: (n) => `Obrigado, ${n}. A sua família vai guardar isto com carinho. Até logo.`,
	enterCode: 'Bem-vindo à Kinstory. Digite o seu código de seis dígitos.',
	codeWrong:
		'Desculpe, o código não confere. Verifique o cartão da sua família e ligue de novo. Até logo.',
	voicemail: (n, num) =>
		`Olá ${n}, aqui é a Kinstory com a pergunta da semana da sua família. Ligue para ${num} quando quiser para responder. Até logo.`,
	didNotHear: 'Desculpe, não ouvimos nada. Até logo.',
	greeting: (n) => `Olá, ${n}`,
	questionFrom: (a) => `Uma pergunta de ${a}`,
	record: 'Toque para começar a falar',
	stop: 'Toque quando terminar',
	listen: 'Ouvir de novo',
	again: 'Começar de novo',
	send: 'Enviar para a minha família',
	sending: 'A enviar…',
	sent: 'Obrigado! A sua família vai adorar.',
	sentMore: 'Responder outra pergunta',
	anotherQuestion: 'Escolher outra pergunta',
	anyStory: 'Contar a história que quiser',
	upload: 'Ou enviar uma gravação que já tenha',
	micBlocked:
		'O microfone está desligado para esta página. Permita-o no navegador ou ligue em vez disso.',
	orCall: (num, pin) => `Prefere o telefone? Ligue para ${num} e digite ${pin}.`,
	recording: 'A gravar',
	failed: 'Não foi possível enviar. Tente novamente.'
};

const nl: ElderStrings = {
	hello: (n) => `Hallo ${n}.`,
	thisWeek: (a) =>
		a
			? `Dit is Kinstory, met de vraag van deze week van ${a}.`
			: `Dit is Kinstory, met de vraag van deze week.`,
	takeYourTime:
		'Neem rustig de tijd. Vertel na de toon uw verhaal. Als u klaar bent, druk dan op het hekje, of hang gewoon op.',
	noQuestion:
		'Er staat deze week geen vraag klaar, maar na de toon kunt u elk verhaal vertellen dat u wilt.',
	thanks: (n) => `Dank u wel, ${n}. Uw familie zal dit koesteren. Tot ziens.`,
	enterCode: 'Welkom bij Kinstory. Toets uw zescijferige code in.',
	codeWrong:
		'Helaas klopt die code niet. Kijk op het kaartje van uw familie en bel opnieuw. Tot ziens.',
	voicemail: (n, num) =>
		`Hallo ${n}, dit is Kinstory met de vraag van deze week van uw familie. Bel ${num} wanneer u wilt om te antwoorden. Tot ziens.`,
	didNotHear: 'Helaas hebben we niets gehoord. Tot ziens.',
	greeting: (n) => `Hallo, ${n}`,
	questionFrom: (a) => `Een vraag van ${a}`,
	record: 'Tik om te beginnen met praten',
	stop: 'Tik als u klaar bent',
	listen: 'Terugluisteren',
	again: 'Opnieuw beginnen',
	send: 'Naar mijn familie sturen',
	sending: 'Bezig met versturen…',
	sent: 'Dank u wel! Uw familie zal dit prachtig vinden.',
	sentMore: 'Nog een vraag beantwoorden',
	anotherQuestion: 'Een andere vraag kiezen',
	anyStory: 'Een verhaal naar keuze vertellen',
	upload: 'Of stuur een opname die u al hebt',
	micBlocked: 'De microfoon staat uit voor deze pagina. Sta hem toe in de browser, of bel liever.',
	orCall: (num, pin) => `Liever bellen? Bel ${num} en toets ${pin}.`,
	recording: 'Opname',
	failed: 'Versturen is mislukt. Probeer het opnieuw.'
};

export const ELDER_STRINGS: Record<string, ElderStrings> = { en, es, fr, de, it, pt, nl };

export function elderStrings(lang: string | null | undefined): ElderStrings {
	return ELDER_STRINGS[lang ?? 'en'] ?? en;
}

/** Neural voices that read each language naturally (Amazon Polly names, as used by Twilio). */
export const PHONE_VOICES: Record<string, { voice: string; language: string }> = {
	en: { voice: 'Polly.Joanna-Neural', language: 'en-US' },
	es: { voice: 'Polly.Lupe-Neural', language: 'es-US' },
	fr: { voice: 'Polly.Lea-Neural', language: 'fr-FR' },
	de: { voice: 'Polly.Vicki-Neural', language: 'de-DE' },
	it: { voice: 'Polly.Bianca-Neural', language: 'it-IT' },
	pt: { voice: 'Polly.Camila-Neural', language: 'pt-BR' },
	nl: { voice: 'Polly.Laura-Neural', language: 'nl-NL' }
};
