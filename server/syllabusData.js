// Maintainable SSC CGL syllabus data used by seed.js. Not imported into JSX.
const mk = (subject, names) => names.map((name, i) => ({ subject, name, order: i }));

export const syllabusData = [
  ...mk("Mathematics", [
    "Number System", "HCF & LCM", "Percentage", "Profit & Loss", "Ratio & Proportion",
    "Average", "Time & Work", "Time, Speed & Distance", "Simple Interest", "Compound Interest",
    "Algebra", "Geometry", "Mensuration", "Trigonometry", "Height & Distance",
    "Data Interpretation", "Statistics", "Mixture & Alligation", "Partnership", "Coordinate Geometry",
  ]),
  ...mk("English", [
    "Parts of Speech", "Articles", "Tenses", "Subject Verb Agreement", "Prepositions",
    "Conjunctions", "Active Passive Voice", "Direct Indirect Narration", "Spotting Errors",
    "Sentence Improvement", "Vocabulary", "Synonyms", "Antonyms", "Idioms & Phrases",
    "One Word Substitution", "Spelling Correction", "Cloze Test", "Fill in the Blanks",
    "Para Jumbles", "Reading Comprehension",
  ]),
  ...mk("Reasoning", [
    "Analogy", "Classification", "Series (Number/Alphabet)", "Coding-Decoding",
    "Blood Relations", "Direction Sense", "Ranking & Order", "Alphabet Test",
    "Venn Diagram", "Syllogism", "Statement & Conclusion", "Non-Verbal Reasoning",
    "Mirror & Water Images", "Paper Folding & Cutting", "Embedded Figures",
    "Matrix", "Puzzle", "Seating Arrangement", "Word Formation", "Missing Number",
  ]),
  ...mk("General Awareness", [
    "Ancient Indian History", "Medieval Indian History", "Modern Indian History",
    "Indian Geography", "World Geography", "Indian Polity", "Constitution",
    "Indian Economy", "Budget & Five Year Plans", "Physics", "Chemistry", "Biology",
    "Static GK (Books, Awards, etc.)", "Important Days", "Sports", "Government Schemes",
    "Current Affairs", "Science & Technology", "Art & Culture", "International Organisations",
  ]),
];
