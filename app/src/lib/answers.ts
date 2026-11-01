// SERVER-ONLY. Do not import from any client component — this file holds the
// quiz answer key. Only /api/voucher should import it; Next.js will then keep
// it out of the browser bundle entirely. (Importing it from a client module
// would silently ship the answers to every visitor.)
import { QUESTIONS } from "./quiz";

// Index into each question's options array, aligned with QUESTIONS order.
export const ANSWERS: readonly number[] = [1, 2, 1, 1, 1];

if (ANSWERS.length !== QUESTIONS.length) {
  throw new Error("ANSWERS must align with QUESTIONS");
}

export function score(answers: number[]): number {
  return answers.reduce((n, a, i) => n + (a === ANSWERS[i] ? 1 : 0), 0);
}
