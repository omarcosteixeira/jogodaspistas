export const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const isAnswerCorrect = (guess: string, answer: string): boolean => {
  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim();
  
  let normGuess = normalize(guess);
  let normAnswer = normalize(answer);

  if (normGuess === normAnswer) return true;

  const aliases = answer.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .split(/(?: \()|(?:\) )|\(|\)/)
      .map(s => s.replace(/[^a-z0-9 ]/g, "").trim())
      .filter(s => s.length > 0);
  
  if (aliases.includes(normGuess)) return true;

  if (normAnswer === "jose do egito" && normGuess === "jose") return true;
  if (normAnswer === "maria madalena" && normGuess === "madalena") return true;
  if (normAnswer.replace("a ", "") === normGuess) return true;
  if (normAnswer.replace("o ", "") === normGuess) return true;

  return false;
};
