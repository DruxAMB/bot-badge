// Client-safe quiz content: questions + options only.
// The answer key lives in ./answers.ts, which is imported solely by
// /api/voucher — it never enters the browser bundle.
export const QUESTIONS = [
  {
    q: "What is BOT Chain's native gas token?",
    options: ["ETH", "BOT", "BNB", "MATIC"],
  },
  {
    q: "What is BOT Chain mainnet's chain ID?",
    options: ["1", "56", "677", "968"],
  },
  {
    q: "On the ecosystem leaderboard, how long must a wallet wait between votes?",
    options: ["1 hour", "6 hours", "24 hours", "1 week"],
  },
  {
    q: "Which explorer serves BOT Chain?",
    options: ["etherscan.io", "scan.botchain.ai", "bscscan.com", "botscan.org"],
  },
  {
    q: "What is the weekly leaderboard prize pool?",
    options: ["10 BOT", "50 BOT", "500 BOT", "1,000 BOT"],
  },
] as const;

export const PASS = 4; // of 5
