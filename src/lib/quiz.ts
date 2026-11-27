import type { Question } from './schemas';

/** Respuestas elegidas por ID de pregunta. */
export type Answers = Readonly<Record<string, string>>;

export function score(questions: Pick<Question, 'id' | 'answer'>[], answers: Answers) {
  return {
    correct: questions.filter((question) => answers[question.id] === question.answer).length,
    answered: questions.filter((question) => answers[question.id] !== undefined).length,
    total: questions.length,
  };
}
