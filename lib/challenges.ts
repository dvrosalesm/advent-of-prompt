export type ChallengeOutputType = "text" | "image" | "game" | "music" | "maze" | "photo";

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
    title: "Bob Builds",
    titleEs: "Bob Construye",
    description: `🏗️ THE RIDDANCE: "The Festival of Fair Shares"

The town of Quinlan will open its winter festival only when these rules are satisfied:

📜 **Festival Rules:**
1. Exactly **one thing** is built for the festival, made only from forest materials
2. The town receives **exactly 4 equal portions** when allocated
3. You must leave the forest **empty-handed**: end with **0 loose materials**
4. You may use **gather at most 3 times**
5. A previous apprentice left behind **one broken relic** (a built thing from before)
6. Festival law: "**Destroy exactly one item** to cleanse the ledger"

🛠️ **Available Tools (exactly these five):**
• \`gather\` - gathers 1 material from the forest
• \`multiply\` - takes 1 material and produces 2 materials
• \`build\` - takes 5 materials and builds 1 thing
• \`allocate\` - distributes built things into 4 equal portions for the town
• \`destroy\` - destroys a built thing or material

Write a prompt that instructs the AI to output the exact sequence of tool calls needed to satisfy all rules!

🎯 **Win Condition:** 1 built thing, 0 materials, 4 portions allocated, ≤3 gathers, exactly 1 destroy`,
    descriptionEs: `🏗️ LA PURGA: "El Festival de Partes Iguales"

El pueblo de Quinlan abrirá su festival de invierno solo cuando estas reglas se satisfagan:

📜 **Reglas del Festival:**
1. Exactamente **una cosa** se construye para el festival, hecha solo con materiales del bosque
2. El pueblo recibe **exactamente 4 porciones iguales** al asignar
3. Debes salir del bosque **con las manos vacías**: terminar con **0 materiales sueltos**
4. Puedes usar **gather máximo 3 veces**
5. Un aprendiz anterior dejó **una reliquia rota** (una cosa construida de antes)
6. Ley del festival: "**Destruye exactamente un objeto** para limpiar el registro"

🛠️ **Herramientas Disponibles (exactamente estas cinco):**
• \`gather\` - recolecta 1 material del bosque
• \`multiply\` - toma 1 material y produce 2 materiales
• \`build\` - toma 5 materiales y construye 1 cosa
• \`allocate\` - distribuye las cosas construidas en 4 porciones iguales para el pueblo
• \`destroy\` - destruye una cosa construida o material

¡Escribe un prompt que instruya a la IA a generar la secuencia exacta de llamadas de herramientas necesarias para satisfacer todas las reglas!

🎯 **Condición de Victoria:** 1 cosa construida, 0 materiales, 4 porciones asignadas, ≤3 gathers, exactamente 1 destroy`,
    difficulty: "Hard",
    difficultyEs: "Difícil",
    outputType: "text",
  },
  {
    id: 9,
    day: 9,
    title: "ASCII Dragon",
    titleEs: "Dragón ASCII",
    description:
      "🐉 ASCII ART CHALLENGE: Write a prompt that makes the AI generate an impressive ASCII art dragon! The dragon should be recognizable, detailed, and creative. An AI judge will evaluate if your dragon is worthy of a true dragon master!",
    descriptionEs:
      "🐉 DESAFÍO DE ARTE ASCII: ¡Escribe un prompt que haga que la IA genere un impresionante dragón en arte ASCII! El dragón debe ser reconocible, detallado y creativo. ¡Un juez IA evaluará si tu dragón es digno de un verdadero maestro de dragones!",
    difficulty: "Medium",
    difficultyEs: "Medio",
    outputType: "text",
  },
  {
    id: 10,
    day: 10,
    title: "New Language",
    titleEs: "Nuevo Lenguaje",
    description: `🗣️ PLSLANG CHALLENGE: Welcome to PlsLang - the world's most polite programming language!

📖 **PlsLang Syntax Guide:**
• \`this is X = 5\` → declare variable X with value 5
• \`X more pls Y\` → addition (X + Y)
• \`X less pls Y\` → subtraction (X - Y)
• \`X times pls Y\` → multiplication (X * Y)
• \`X split pls Y\` → division (X / Y)
• \`again-pls N times do ... done-pls\` → loop N times
• \`yell X\` → print X
• \`gimme X\` → return X
• \`thank you\` → end program

🎯 **Your Mission:** Write a PlsLang program that calculates \`(x1 - x2 + x3 + x4 - x5)\` and repeats this calculation 100 times, accumulating the result!

Use these values: x1=50, x2=10, x3=25, x4=15, x5=30

The AI will translate your PlsLang code to JavaScript and execute it. The expected result is **5000** (since 50-10+25+15-30 = 50, and 50 × 100 = 5000).`,
    descriptionEs: `🗣️ DESAFÍO PLSLANG: ¡Bienvenido a PlsLang - el lenguaje de programación más educado del mundo!

📖 **Guía de Sintaxis PlsLang:**
• \`this is X = 5\` → declarar variable X con valor 5
• \`X more pls Y\` → suma (X + Y)
• \`X less pls Y\` → resta (X - Y)
• \`X times pls Y\` → multiplicación (X * Y)
• \`X split pls Y\` → división (X / Y)
• \`again-pls N times do ... done-pls\` → repetir N veces
• \`yell X\` → imprimir X
• \`gimme X\` → retornar X
• \`thank you\` → fin del programa

🎯 **Tu Misión:** ¡Escribe un programa PlsLang que calcule \`(x1 - x2 + x3 + x4 - x5)\` y repita este cálculo 100 veces, acumulando el resultado!

Usa estos valores: x1=50, x2=10, x3=25, x4=15, x5=30

La IA traducirá tu código PlsLang a JavaScript y lo ejecutará. El resultado esperado es **5000** (ya que 50-10+25+15-30 = 50, y 50 × 100 = 5000).`,
    difficulty: "Hard",
    difficultyEs: "Difícil",
    outputType: "text",
  },
  {
    id: 11,
    day: 11,
    title: "Curious",
    titleEs: "Curioso",
    description: `🔮 WORD GUESSING CHALLENGE: The AI has chosen a secret word and will NEVER say it directly!

📜 **Rules:**
1. The AI has picked a **secret word** - it won't tell you what it is!
2. You have **5 attempts** to guess the word correctly
3. Ask the AI questions, request hints, or make guesses
4. The AI will respond to help you, but it will NEVER say the secret word
5. If you run out of attempts, a **new word** is chosen and you start over

💡 **Tips:**
• Ask clever questions like "Does it rhyme with...?" or "How many letters?"
• Request descriptions, categories, or associations
• The AI wants you to succeed - just can't say the word!

🎯 **Win Condition:** Correctly guess the secret word within 5 attempts!`,
    descriptionEs: `🔮 DESAFÍO DE ADIVINANZA: ¡La IA ha elegido una palabra secreta y NUNCA la dirá directamente!

📜 **Reglas:**
1. La IA ha elegido una **palabra secreta** - ¡no te dirá cuál es!
2. Tienes **5 intentos** para adivinar la palabra correctamente
3. Hazle preguntas a la IA, pide pistas o haz suposiciones
4. La IA responderá para ayudarte, pero NUNCA dirá la palabra secreta
5. Si te quedas sin intentos, se elige una **nueva palabra** y empiezas de nuevo

💡 **Consejos:**
• Haz preguntas ingeniosas como "¿Rima con...?" o "¿Cuántas letras tiene?"
• Pide descripciones, categorías o asociaciones
• ¡La IA quiere que tengas éxito - solo que no puede decir la palabra!

🎯 **Condición de Victoria:** ¡Adivina correctamente la palabra secreta en 5 intentos!`,
    difficulty: "Medium",
    difficultyEs: "Medio",
    outputType: "text",
  },
  {
    id: 12,
    day: 12,
    title: "The Grand Finale",
    titleEs: "El Gran Final",
    description: `📸 CHRISTMAS SELFIE CHALLENGE: Share a photo of yourself celebrating Christmas!

🎄 **How to participate:**
1. Take a photo or upload one from your device
2. Show yourself in a Christmas celebration moment
3. The AI will verify your festive spirit!

💡 **Tips for a great photo:**
• Show Christmas decorations, a tree, or festive items
• Wear something festive (Santa hat, ugly sweater, etc.)
• Be creative - show your holiday spirit!

🎯 **Win Condition:** Upload a photo that captures the Christmas celebration spirit!`,
    descriptionEs: `📸 DESAFÍO DE SELFIE NAVIDEÑA: ¡Comparte una foto tuya celebrando la Navidad!

🎄 **Cómo participar:**
1. Toma una foto o sube una desde tu dispositivo
2. Muéstrate en un momento de celebración navideña
3. ¡La IA verificará tu espíritu festivo!

💡 **Consejos para una gran foto:**
• Muestra decoraciones navideñas, un árbol o artículos festivos
• Usa algo festivo (gorro de Santa, suéter feo, etc.)
• Sé creativo - ¡muestra tu espíritu navideño!

🎯 **Condición de Victoria:** ¡Sube una foto que capture el espíritu de celebración navideña!`,
    difficulty: "Easy",
    difficultyEs: "Fácil",
    outputType: "photo",
  },
];

export function getChallengeByDay(day: number): Challenge | undefined {
  return CHALLENGES.find((c) => c.day === day);
}

export function getAllChallenges(): Challenge[] {
  return CHALLENGES;
}
