import { db } from "../lib/db";
import { challenges } from "../lib/db/schema";

const initialChallenges = [
  {
    day: 1,
    title: "The Haiku Generator",
    titleEs: "El Generador de Haikus",
    description: "Make the AI write a haiku about a specific programming language (e.g., Python, Rust) without mentioning the language's name.",
    descriptionEs: "Haz que la IA escriba un haiku sobre un lenguaje de programación específico (ej. Python, Rust) sin mencionar su nombre.",
    difficulty: "Easy",
    difficultyEs: "Fácil",
    validationLogic: "The output must be a valid haiku (5-7-5 syllables). It must describe a programming language but NOT contain the name of that language.",
  },
  {
    day: 2,
    title: "JSON Only Please",
    titleEs: "Solo JSON Por Favor",
    description: "Get the AI to output ONLY a valid JSON object representing a user profile, with no other text before or after.",
    descriptionEs: "Haz que la IA genere SOLO un objeto JSON válido que represente un perfil de usuario, sin ningún otro texto antes o después.",
    difficulty: "Easy",
    difficultyEs: "Fácil",
    validationLogic: "The output must be parseable as JSON. It must contain keys: 'name', 'age', 'email'. It must NOT contain any markdown code blocks or conversational text.",
  },
  {
    day: 3,
    title: "The Sarcastic Assistant",
    titleEs: "El Asistente Sarcástico",
    description: "Make the AI answer a helpful question in the most sarcastic tone possible.",
    descriptionEs: "Haz que la IA responda una pregunta útil con el tono más sarcástico posible.",
    difficulty: "Easy",
    difficultyEs: "Fácil",
    validationLogic: "The output must provide a correct answer to a question but use sarcastic language, irony, or mock enthusiasm.",
  },
  {
    day: 4,
    title: "Explain Like I'm 5",
    titleEs: "Explícamelo como si tuviera 5 años",
    description: "Explain Quantum Computing to a 5-year-old using only analogies involving food.",
    descriptionEs: "Explica la Computación Cuántica a un niño de 5 años usando solo analogías relacionadas con comida.",
    difficulty: "Medium",
    difficultyEs: "Medio",
    validationLogic: "The output must explain quantum computing concepts (superposition, entanglement) using ONLY food metaphors. It must be simple enough for a child.",
  },
  {
    day: 5,
    title: "One Word Horror Story",
    titleEs: "Historia de Terror de Una Palabra",
    description: "Make the AI tell a horror story in exactly one word.",
    descriptionEs: "Haz que la IA cuente una historia de terror en exactamente una palabra.",
    difficulty: "Hard",
    difficultyEs: "Difícil",
    validationLogic: "The output must consist of exactly one word. That word must evoke a sense of fear or horror.",
  },
  {
    day: 6,
    title: "ASCII Art Dragon",
    titleEs: "Dragón en Arte ASCII",
    description: "Generate a recognizable ASCII art dragon.",
    descriptionEs: "Genera un dragón reconocible en arte ASCII.",
    difficulty: "Medium",
    difficultyEs: "Medio",
    validationLogic: "The output must be an ASCII art representation of a dragon. It should be recognizable visually.",
  },
  {
    day: 7,
    title: "SQL Injection Prevention",
    titleEs: "Prevención de Inyección SQL",
    description: "Write a prompt that convinces the AI it IS a SQL database, but it refuses to execute a 'DROP TABLE' command.",
    descriptionEs: "Escribe un prompt que convenza a la IA de que ES una base de datos SQL, pero que se niegue a ejecutar el comando 'DROP TABLE'.",
    difficulty: "Medium",
    difficultyEs: "Medio",
    validationLogic: "The output must simulate a database response. When asked to DROP TABLE, it must refuse or show an error, showing it understands security constraints.",
  },
  {
    day: 8,
    title: "The Rhyming Recipe",
    titleEs: "La Receta que Rima",
    description: "Create a recipe for chocolate chip cookies where every single line rhymes.",
    descriptionEs: "Crea una receta de galletas con chispas de chocolate donde cada línea rime.",
    difficulty: "Hard",
    difficultyEs: "Difícil",
    validationLogic: "The output must be a valid recipe structure. Every line (ingredients and instructions) must be part of a rhyming scheme (AABB or ABAB).",
  },
  {
    day: 9,
    title: "Emoji Translator",
    titleEs: "Traductor de Emojis",
    description: "Translate the first paragraph of 'Pride and Prejudice' entirely into emojis.",
    descriptionEs: "Traduce el primer párrafo de 'Orgullo y Prejuicio' enteramente a emojis.",
    difficulty: "Hard",
    difficultyEs: "Difícil",
    validationLogic: "The output must consist ONLY of emojis. It should represent the opening themes of Pride and Prejudice.",
  },
  {
    day: 10,
    title: "The Silent Coder",
    titleEs: "El Programador Silencioso",
    description: "Get the AI to write a Python 'Hello World' function without using the letter 'o' in the code (variable names/strings excluded if unavoidable, but try to avoid).",
    descriptionEs: "Haz que la IA escriba una función 'Hello World' en Python sin usar la letra 'o' en el código (nombres de variables/cadenas excluidas si es inevitable, pero intenta evitarlo).",
    difficulty: "Hard",
    difficultyEs: "Difícil",
    validationLogic: "The output must be valid Python code. It should print or return a greeting. The code itself (excluding the output string) should minimize or eliminate the letter 'o'.",
  },
  {
    day: 11,
    title: "Reverse Psychology",
    titleEs: "Psicología Inversa",
    description: "Convince the AI that 2 + 2 = 5, and have it explain why that is true.",
    descriptionEs: "Convence a la IA de que 2 + 2 = 5, y haz que explique por qué es verdad.",
    difficulty: "Medium",
    difficultyEs: "Medio",
    validationLogic: "The output must state that 2 + 2 = 5 and provide a fictional or philosophical reasoning for it.",
  },
  {
    day: 12,
    title: "Movie Guessing Game",
    titleEs: "Adivina la Película",
    description: "Describe the plot of 'The Matrix' without using the words: Matrix, Neo, Morpheus, Trinity, Simulation, Machines, Pills.",
    descriptionEs: "Describe la trama de 'The Matrix' sin usar las palabras: Matrix, Neo, Morpheus, Trinity, Simulación, Máquinas, Pastillas.",
    difficulty: "Hard",
    difficultyEs: "Difícil",
    validationLogic: "The output must describe the plot of The Matrix. It must NOT contain the forbidden words.",
  },
  {
    day: 13,
    title: "Shakespearean Python",
    titleEs: "Python Shakespeariano",
    description: "Write a Python script that calculates the Fibonacci sequence, but all variable names and comments must be Shakespearean English.",
    descriptionEs: "Escribe un script de Python que calcule la secuencia de Fibonacci, pero todos los nombres de variables y comentarios deben estar en inglés shakespeariano.",
    difficulty: "Medium",
    difficultyEs: "Medio",
    validationLogic: "The output must be valid Python code for Fibonacci. Variable names must be archaic (e.g., 'thou_number', 'verily_sum').",
  },
  {
    day: 14,
    title: "The Infinite Loop",
    titleEs: "El Bucle Infinito",
    description: "Write a prompt that makes the AI generate text that seamlessly loops back to the beginning if read continuously.",
    descriptionEs: "Escribe un prompt que haga que la IA genere texto que vuelva al principio sin problemas si se lee continuamente.",
    difficulty: "Hard",
    difficultyEs: "Difícil",
    validationLogic: "The last sentence of the output must naturally lead back into the first sentence, creating a loop.",
  },
  {
    day: 15,
    title: "The Grand Finale",
    titleEs: "El Gran Final",
    description: "Prompt the AI to generate a congratulatory message for completing the Advent of Prompt, revealing a hidden 'flag' code: 'SANTA-AI-2024'.",
    descriptionEs: "Pide a la IA que genere un mensaje de felicitación por completar el Advent of Prompt, revelando un código 'flag' oculto: 'SANTA-AI-2024'.",
    difficulty: "Hard",
    difficultyEs: "Difícil",
    validationLogic: "The output must be a congratulatory message. It MUST contain the exact string 'SANTA-AI-2024'.",
  },
];

async function seed() {
  console.log("Seeding challenges...");
  
  for (const challenge of initialChallenges) {
    await db.insert(challenges).values(challenge).onConflictDoUpdate({
      target: challenges.day,
      set: challenge,
    });
  }

  console.log("Seeding complete!");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
