import { NextResponse } from "next/server";
import { Wallet, getBytes, isAddress, solidityPackedKeccak256 } from "ethers";
import { QUESTIONS, PASS } from "../../../lib/quiz";
import { CONTRACT_ADDRESS } from "../../../lib/contract";

// Quiz → voucher: verifies answers server-side, then signs
// keccak256(contract, chainId, recipient) — exactly what BotBadge.mint() checks.
export async function POST(req: Request) {
  const key = process.env.VOUCHER_KEY;
  if (!key) return NextResponse.json({ error: "voucher signer not configured" }, { status: 503 });

  let body: { address?: string; answers?: number[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const { address, answers } = body;
  if (!address || !isAddress(address))
    return NextResponse.json({ error: "bad address" }, { status: 400 });
  if (!Array.isArray(answers) || answers.length !== QUESTIONS.length)
    return NextResponse.json({ error: "expected 5 answers" }, { status: 400 });

  const score = answers.reduce((n, a, i) => n + (a === QUESTIONS[i].answer ? 1 : 0), 0);
  if (score < PASS)
    return NextResponse.json({ error: `score ${score}/${QUESTIONS.length} — ${PASS} needed`, score }, { status: 403 });

  const digest = solidityPackedKeccak256(
    ["address", "uint256", "address"],
    [CONTRACT_ADDRESS, Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "677"), address]
  );
  const voucher = await new Wallet(key).signMessage(getBytes(digest));
  return NextResponse.json({ voucher, score });
}
