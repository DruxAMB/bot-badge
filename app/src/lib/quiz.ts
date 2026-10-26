// Shared between the page (renders) and /api/voucher (scores + signs).
// answer = index into options.
export const QUESTIONS = [
  {
    q: "What is BOT Chain's native gas token?",
    options: ["ETH", "BOT", "BNB", "MATIC"],
    answer: 1,
  },
  {
    q: "What is BOT Chain mainnet's chain ID?",
    options: ["1", "56", "677", "968"],
    answer: 2,
  },
  {
    q: "On the ecosystem leaderboard, how long must a wallet wait between votes?",
    options: ["1 hour", "6 hours", "24 hours", "1 week"],
    answer: 1,
  },
  {
    q: "Which explorer serves BOT Chain?",
    options: ["etherscan.io", "scan.botchain.ai", "bscscan.com", "botscan.org"],
    answer: 1,
  },
  {
    q: "What is the weekly leaderboard prize pool?",
    options: ["10 BOT", "50 BOT", "500 BOT", "1,000 BOT"],
    answer: 1,
  },
] as const;

export const PASS = 4; // of 5
