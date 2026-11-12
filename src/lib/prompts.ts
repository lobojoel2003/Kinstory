// The question library. Good questions are specific, sensory and easy to
// start answering: "What did your mother's kitchen smell like?" gets a story
// where "Tell me about your childhood" gets a sigh.

export interface PromptCategory {
	id: string;
	label: string;
	questions: string[];
}

export const PROMPT_LIBRARY: PromptCategory[] = [
	{
		id: 'childhood',
		label: 'Childhood',
		questions: [
			'What did your mother’s kitchen smell like?',
			'Describe the house you grew up in, room by room.',
			'What was your favourite hiding place as a child?',
			'Who was your best friend when you were ten, and what did you get up to?',
			'What games did you play outside, and who taught them to you?',
			'What was a typical Sunday like when you were small?',
			'What did you get in trouble for most often?',
			'What was the first thing you remember wanting very badly?'
		]
	},
	{
		id: 'family',
		label: 'Parents & family',
		questions: [
			'What is one thing your father always used to say?',
			'How did your parents meet, as you heard it told?',
			'What did your grandparents do for a living?',
			'Which relative did everyone tell stories about?',
			'What was a family tradition you loved, and do we still keep it?',
			'What did your family argue about at the dinner table?',
			'What is a recipe that came down to you, and who taught it to you?'
		]
	},
	{
		id: 'school',
		label: 'School & growing up',
		questions: [
			'Tell me about a teacher you never forgot.',
			'What was your walk to school like?',
			'What did you want to be when you grew up?',
			'What was your first job, and what did you do with the money?',
			'What music did you dance to as a teenager?',
			'What did you do on a Saturday night when you were eighteen?'
		]
	},
	{
		id: 'love',
		label: 'Love & marriage',
		questions: [
			'How did you meet the love of your life?',
			'What was your first date like?',
			'Tell me about your wedding day, from the moment you woke up.',
			'What is the secret to staying together, if there is one?',
			'What did you fall in love with first?',
			'Tell me about a time you two laughed until you cried.'
		]
	},
	{
		id: 'parenthood',
		label: 'Raising a family',
		questions: [
			'What do you remember about the day your first child was born?',
			'What was the hardest part of raising children?',
			'What was bedtime like in your house?',
			'What is something your children did that still makes you laugh?',
			'What did you hope your children would learn from you?'
		]
	},
	{
		id: 'work',
		label: 'Work & making a living',
		questions: [
			'What was it like on your first day at your longest job?',
			'Who was the best boss you ever had, and why?',
			'What was the most money you ever had at once, and what did you do with it?',
			'What work are you proudest of?',
			'Tell me about a time you had to start over.'
		]
	},
	{
		id: 'places',
		label: 'Places & journeys',
		questions: [
			'What do you remember about leaving home?',
			'Describe the street you lived on in your twenties.',
			'What is the most beautiful place you have ever been?',
			'Tell me about a journey that did not go to plan.',
			'Where did you feel most at home, and why?'
		]
	},
	{
		id: 'history',
		label: 'Times & history',
		questions: [
			'Tell me about a night you’ll never forget.',
			'Where were you when you heard big news that changed things?',
			'What things that are ordinary now seemed like magic when they first arrived?',
			'What was a hard year, and how did you get through it?',
			'How was the world different when you were my age?'
		]
	},
	{
		id: 'wisdom',
		label: 'Wisdom & reflection',
		questions: [
			'What do you want your great-grandchildren to know?',
			'What is the best advice you were ever given?',
			'What are you most grateful for?',
			'What did you change your mind about as you got older?',
			'What do you hope people say about you?',
			'If you could relive one ordinary day, which would it be?'
		]
	}
];

/** The questions a new book starts with: a gentle mix across a life. */
export const STARTER_QUESTIONS = [
	'What did your mother’s kitchen smell like?',
	'Describe the house you grew up in, room by room.',
	'Tell me about a teacher you never forgot.',
	'What was your first job, and what did you do with the money?',
	'How did you meet the love of your life?',
	'What do you remember about leaving home?',
	'Tell me about a night you’ll never forget.',
	'What is the best advice you were ever given?',
	'What do you want your great-grandchildren to know?'
];
