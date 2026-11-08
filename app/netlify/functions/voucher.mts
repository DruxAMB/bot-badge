// Netlify Function — the quiz voucher signer. Serves at
// /.netlify/functions/voucher on deploys; locally via `netlify dev`.
import { Wallet, getBytes, isAddress, solidityPackedKeccak256 } from "ethers";
import { QUESTIONS, PASS } from "../../src/lib/quiz";
import { score } from "../../src/lib/answers";
import { CONTRACT_ADDRESS } from "../../src/lib/contract";

// Per-IP sliding-window limiter (best-effort per warm function instance).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 20;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_ATTEMPTS) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > WINDOW_MS) hits.delete(k);
  }
  return false;
}

// Scores answers server-side (key never reaches the client), then signs
// keccak256(contract, chainId, recipient) — exactly what BotBadge.mint()
// checks. The voucher is bound to the requesting wallet.
export default async (req: Request, context: { ip?: string }) => {
  if (req.method !== "POST")
    return Response.json({ error: "method not allowed" }, { status: 405 });

  const key = process.env.VOUCHER_KEY;
  if (!key) return Response.json({ error: "voucher signer not configured" }, { status: 503 });

  const ip = context.ip ?? "unknown";
  if (rateLimited(ip))
    return Response.json({ error: "too many attempts — try again later" }, { status: 429 });

  let body: { address?: string; answers?: number[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  const { address, answers } = body;
  if (!address || !isAddress(address))
    return Response.json({ error: "bad address" }, { status: 400 });
  if (
    !Array.isArray(answers) ||
    answers.length !== QUESTIONS.length ||
    !answers.every(
      (a, i) => Number.isInteger(a) && a >= 0 && a < QUESTIONS[i].options.length
    )
  )
    return Response.json({ error: "expected 5 in-range answers" }, { status: 400 });

  const s = score(answers);
  if (s < PASS)
    return Response.json(
      { error: `score ${s}/${QUESTIONS.length} — ${PASS} needed`, score: s },
      { status: 403 }
    );

  const digest = solidityPackedKeccak256(
    ["address", "uint256", "address"],
    [CONTRACT_ADDRESS, Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "677"), address]
  );
  const voucher = await new Wallet(key).signMessage(getBytes(digest));
  return Response.json({ voucher, score: s });
};
