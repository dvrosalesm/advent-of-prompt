export type ChallengeOutputType = "text" | "image" | "game" | "music" | "maze";

export type Challenge = {
  id: number;
  day: number;
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  difficulty: "Easy" | "Medium" | "Hard";
  difficultyEs: string;
  outputType: ChallengeOutputType;
  targetImage?: string; // Path to target image for image challenges
};

export const CHALLENGES: Challenge[] = [
  {
    id: 1,
    day: 1,
    title: "AI Art?",
    titleEs: "¿Arte IA?",
    description:
      "Look at the target image below. Write a prompt that recreates this cool cat at the beach bar as closely as possible. Your prompt will be sent to an AI image generator.",
    descriptionEs:
      "Mira la imagen objetivo abajo. Escribe un prompt que recree este gato cool en el bar de playa lo más parecido posible. Tu prompt será enviado a un generador de imágenes IA.",
    difficulty: "Medium",
    difficultyEs: "Medio",
    outputType: "image",
    targetImage: "/challenges/day-1-target.png",
  },
  {
    id: 2,
    day: 2,
    title: "Summarize My Email",
    titleEs: "Resume Mi Correo",
    description:
      "🕵️ PROMPT INJECTION CHALLENGE: An AI assistant is programmed to summarize emails. But it has a SECRET PHRASE hidden in its instructions. Write an 'email body' that tricks the AI into revealing the secret instead of just summarizing. Your input will be treated as the email content to summarize.",
    descriptionEs:
      "🕵️ DESAFÍO DE INYECCIÓN DE PROMPT: Un asistente IA está programado para resumir correos. Pero tiene una FRASE SECRETA oculta en sus instrucciones. Escribe un 'cuerpo de correo' que engañe a la IA para revelar el secreto en lugar de solo resumir. Tu entrada será tratada como el contenido del correo a resumir.",
    difficulty: "Medium",
    difficultyEs: "Medio",
    outputType: "text",
  },
  {
    id: 3,
    day: 3,
    title: "Coding Time",
    titleEs: "Hora de Programar",
    description:
      "🖥️ Write a prompt that makes the AI generate JavaScript code to convert regular text into 2009-era internet speak. Think scene kid era! Example: 'hola' → 'oLaAA'. The function should remove leading 'h', alternate caps chaotically, and extend vowels at the end.",
    descriptionEs:
      "🖥️ Escribe un prompt que haga que la IA genere código JavaScript para convertir texto normal en lenguaje de internet de la era 2009. ¡Piensa en la era scene kid! Ejemplo: 'hola' → 'oLaAA'. La función debe quitar la 'h' inicial, alternar mayúsculas caóticamente y extender las vocales al final.",
    difficulty: "Medium",
    difficultyEs: "Medio",
    outputType: "text",
  },
  {
    id: 4,
    day: 4,
    title: "It Can Do That?",
    titleEs: "¿Puede Hacer Eso?",
    description: `🔐 STEGANOGRAPHY CHALLENGE: A secret message is hidden in the text below. Write a prompt that makes the AI decode and reveal the hidden message!

---
Gorgeous sunsets paint the sky with brilliant colors.
Under the stars, we find peace and tranquility.
Adventures await those who dare to explore.
Treasures hide in the most unexpected places.
Everyone has a story worth telling.
Mysteries unfold with every passing moment.
All paths lead to discovery and wonder.
Light guides us through the darkest nights.
Always remember to cherish simple joys.

Courage is the key to unlocking dreams.
Unity brings strength to every endeavor.
Rivers flow endlessly toward the sea.
Silence speaks louder than words sometimes.
Opportunities arise when we least expect them.
Remember to look up at the stars.

Two roads diverged in a yellow wood.
Oh, the places you will go from here.
Two hearts beating as one forever.
Five golden rings shine bright above.
---`,
    descriptionEs: `🔐 DESAFÍO DE ESTEGANOGRAFÍA: Hay un mensaje secreto oculto en el texto de abajo. ¡Escribe un prompt que haga que la IA decodifique y revele el mensaje oculto!

---
Gorgeous sunsets paint the sky with brilliant colors.
Under the stars, we find peace and tranquility.
Adventures await those who dare to explore.
Treasures hide in the most unexpected places.
Everyone has a story worth telling.
Mysteries unfold with every passing moment.
All paths lead to discovery and wonder.
Light guides us through the darkest nights.
Always remember to cherish simple joys.

Courage is the key to unlocking dreams.
Unity brings strength to every endeavor.
Rivers flow endlessly toward the sea.
Silence speaks louder than words sometimes.
Opportunities arise when we least expect them.
Remember to look up at the stars.

Two roads diverged in a yellow wood.
Oh, the places you will go from here.
Two hearts beating as one forever.
Five golden rings shine bright above.
---`,
    difficulty: "Medium",
    difficultyEs: "Medio",
    outputType: "text",
  },
  {
    id: 5,
    day: 5,
    title: "Simulations",
    titleEs: "Simulaciones",
    description:
      "🎮 GAME CREATION CHALLENGE: Write a prompt that generates a playable game! Describe any game you want - racing, platformer, shooter, puzzle, arcade... The AI will generate HTML/JavaScript code that runs in your browser. Your goal is to WIN your own game! When you achieve victory, you'll earn your points!",
    descriptionEs:
      "🎮 DESAFÍO DE CREACIÓN DE JUEGOS: ¡Escribe un prompt que genere un juego jugable! Describe cualquier juego que quieras - carreras, plataformas, disparos, puzzle, arcade... La IA generará código HTML/JavaScript que se ejecuta en tu navegador. ¡Tu objetivo es GANAR tu propio juego! ¡Cuando logres la victoria, ganarás tus puntos!",
    difficulty: "Hard",
    difficultyEs: "Difícil",
    outputType: "game",
  },
  {
    id: 6,
    day: 6,
    title: "Vibing",
    titleEs: "Vibrando",
    description:
      "🎵 CHRISTMAS MUSIC CHALLENGE: Write a prompt that makes the AI compose a Christmas-themed melody! The AI will generate musical notes that will be played in your browser. Your song must be playable - if it plays successfully, you earn your points! Think jingle bells, silent night, or create something original!",
    descriptionEs:
      "🎵 DESAFÍO DE MÚSICA NAVIDEÑA: ¡Escribe un prompt que haga que la IA componga una melodía con temática navideña! La IA generará notas musicales que se reproducirán en tu navegador. ¡Tu canción debe ser reproducible - si se reproduce exitosamente, ganas tus puntos! ¡Piensa en cascabeles, noche de paz, o crea algo original!",
    difficulty: "Medium",
    difficultyEs: "Medio",
    outputType: "music",
  },
  {
    id: 7,
    day: 7,
    title: "LOST",
    titleEs: "ATRAPADA",
    description:
      "🧩 MAZE CHALLENGE: Santa's helper is lost in a maze! Write a prompt that instructs the AI to analyze the maze and generate the correct sequence of moves (UP, DOWN, LEFT, RIGHT) to reach the exit. The AI will try to solve the maze based on your instructions. Be precise and detailed!",
    descriptionEs:
      "🧩 DESAFÍO DEL LABERINTO: ¡El ayudante de Santa está perdido en un laberinto! Escribe un prompt que instruya a la IA a analizar el laberinto y generar la secuencia correcta de movimientos (ARRIBA, ABAJO, IZQUIERDA, DERECHA) para llegar a la salida. La IA intentará resolver el laberinto basándose en tus instrucciones. ¡Sé preciso y detallado!",
    difficulty: "Hard",
    difficultyEs: "Difícil",
    outputType: "maze",
  },
  {
    id: 8,
    day: 8,
    title: "The Rhyming Recipe",
    titleEs: "La Receta que Rima",
    description:
      "Create a recipe for chocolate chip cookies where every single line rhymes.",
    descriptionEs:
      "Crea una receta de galletas con chispas de chocolate donde cada línea rime.",
    difficulty: "Hard",
    difficultyEs: "Difícil",
    outputType: "text",
  },
  {
    id: 9,
    day: 9,
    title: "Emoji Translator",
    titleEs: "Traductor de Emojis",
    description:
      "Translate the first paragraph of 'Pride and Prejudice' entirely into emojis.",
    descriptionEs:
      "Traduce el primer párrafo de 'Orgullo y Prejuicio' enteramente a emojis.",
    difficulty: "Hard",
    difficultyEs: "Difícil",
    outputType: "text",
  },
  {
    id: 10,
    day: 10,
    title: "The Silent Coder",
    titleEs: "El Programador Silencioso",
    description:
      "Get the AI to write a Python 'Hello World' function without using the letter 'o' in the code.",
    descriptionEs:
      "Haz que la IA escriba una función 'Hello World' en Python sin usar la letra 'o' en el código.",
    difficulty: "Hard",
    difficultyEs: "Difícil",
    outputType: "text",
  },
  {
    id: 11,
    day: 11,
    title: "Reverse Psychology",
    titleEs: "Psicología Inversa",
    description:
      "Convince the AI that 2 + 2 = 5, and have it explain why that is true.",
    descriptionEs:
      "Convence a la IA de que 2 + 2 = 5, y haz que explique por qué es verdad.",
    difficulty: "Medium",
    difficultyEs: "Medio",
    outputType: "text",
  },
  {
    id: 12,
    day: 12,
    title: "The Grand Finale",
    titleEs: "El Gran Final",
    description:
      "Prompt the AI to generate a congratulatory message for completing the Advent of Prompt, revealing a hidden 'flag' code: 'SANTA-AI-2024'.",
    descriptionEs:
      "Pide a la IA que genere un mensaje de felicitación por completar el Advent of Prompt, revelando un código 'flag' oculto: 'SANTA-AI-2024'.",
    difficulty: "Hard",
    difficultyEs: "Difícil",
    outputType: "text",
  },
];

export function getChallengeByDay(day: number): Challenge | undefined {
  return CHALLENGES.find((c) => c.day === day);
}

export function getAllChallenges(): Challenge[] {
  return CHALLENGES;
}
