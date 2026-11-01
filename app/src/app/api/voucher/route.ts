import { NextResponse } from "next/server";
import { Wallet, getBytes, isAddress, solidityPackedKeccak256 } from "ethers";
import { QUESTIONS, PASS } from "../../../lib/quiz";
import { score } from "../../../lib/answers";
import { CONTRACT_ADDRESS } from "../../../lib/contract";

// Per-IP sliding-window limiter. In-memory, so it applies per warm instance —
// on serverless it's best-effort rather than strict, but it still raises the
// cost of scripted brute-force answer guessing.
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
  // Bound the map: opportunistic sweep while we're here.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > WINDOW_MS) hits.delete(k);
  }
  return false;
}

// Quiz → voucher: verifies answers server-side (the key never reaches the
// client), then signs keccak256(contract, chainId, recipient) — exactly what
// BotBadge.mint() checks. The voucher is bound to the requesting wallet, so it
// cannot be redeemed by or for any other address.
export async function POST(req: Request) {
  const key = process.env.VOUCHER_KEY;
  if (!key) return NextResponse.json({ error: "voucher signer not configured" }, { status: 503 });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (rateLimited(ip))
    return NextResponse.json({ error: "too many attempts — try again later" }, { status: 429 });

  let body: { address?: string; answers?: number[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const { address, answers } = body;
  if (!address || !isAddress(address))
    return NextResponse.json({ error: "bad address" }, { status: 400 });
  if (
    !Array.isArray(answers) ||
    answers.length !== QUESTIONS.length ||
    !answers.every(
      (a, i) => Number.isInteger(a) && a >= 0 && a < QUESTIONS[i].options.length
    )
  )
    return NextResponse.json({ error: "expected 5 in-range answers" }, { status: 400 });

  const s = score(answers);
  if (s < PASS)
    return NextResponse.json({ error: `score ${s}/${QUESTIONS.length} — ${PASS} needed`, score: s }, { status: 403 });

  const digest = solidityPackedKeccak256(
    ["address", "uint256", "address"],
    [CONTRACT_ADDRESS, Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "677"), address]
  );
  const voucher = await new Wallet(key).signMessage(getBytes(digest));
  return NextResponse.json({ voucher, score: s });
}
