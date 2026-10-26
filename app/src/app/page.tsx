"use client";

import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { toast } from "sonner";
import { WalletProvider, ConnectWalletButton, useWallet } from "./Wallet";
import Toaster from "./Toaster";
import { NET } from "../lib/chain";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../lib/contract";
import { QUESTIONS, PASS } from "../lib/quiz";

const DEPLOYED = CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

function readContract() {
  const p = new JsonRpcProvider(NET.rpc, NET.chainId, { staticNetwork: true });
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as unknown as string[], p);
}

type Phase = "quiz" | "passed" | "minted";

function Quiz() {
  const { status, address, provider } = useWallet();
  const [answers, setAnswers] = useState<number[]>(Array(QUESTIONS.length).fill(-1));
  const [phase, setPhase] = useState<Phase>("quiz");
  const [voucher, setVoucher] = useState("");
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [totalMinted, setTotalMinted] = useState<number | null>(null);
  const [badgeId, setBadgeId] = useState<number | null>(null);

  const refreshState = useCallback(async () => {
    if (!DEPLOYED) return;
    try {
      const c = readContract();
      const t = await c.totalMinted();
      setTotalMinted(Number(t));
    } catch {}
  }, []);

  useEffect(() => {
    void refreshState();
  }, [refreshState]);

  // does the connected wallet already hold a badge?
  useEffect(() => {
    setPhase("quiz");
    setVoucher("");
    setBadgeId(null);
    if (status !== "ready" || !DEPLOYED) return;
    readContract()
      .badgeOf(address)
      .then((r: any) => {
        if (r[1]) {
          setBadgeId(Number(r[0]));
          setPhase("minted");
        }
      })
      .catch(() => {});
  }, [status, address]);

  const submitQuiz = async () => {
    if (answers.includes(-1)) return toast.warning("answer all 5 questions");
    if (status !== "ready") return toast.warning("connect your wallet first");
    setBusy(true);
    try {
      const r = await fetch("/api/voucher", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, answers }),
      });
      const j = await r.json();
      if (!r.ok) {
        toast.error(j.error ?? "quiz rejected");
        if (typeof j.score === "number") setScore(j.score);
        return;
      }
      setScore(j.score);
      setVoucher(j.voucher);
      setPhase("passed");
      toast.success(`quiz passed — ${j.score}/5`);
    } catch {
      toast.error("voucher service unreachable");
    } finally {
      setBusy(false);
    }
  };

  const mint = async () => {
    if (!provider || !voucher) return;
    setBusy(true);
    try {
      const signer = await new BrowserProvider(provider as any).getSigner();
      const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as unknown as string[], signer);
      const tx = await c.mint(voucher);
      toast.info("minting…");
      const r = await tx.wait();
      if (r.status === 1) {
        toast.success("badge minted — soulbound to your wallet");
        const [, tid] = (await readContract().badgeOf(address)) as any;
        setBadgeId(Number(tid));
        setPhase("minted");
        void refreshState();
      } else toast.error("transaction reverted");
    } catch (e: any) {
      const m = e?.shortMessage ?? e?.reason ?? "mint failed";
      toast.error(m.includes("already minted") ? "this wallet already has a badge" : m);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 pb-20">
      {!DEPLOYED && (
        <p className="mt-6 rounded border border-warning/40 bg-card px-4 py-3 text-xs text-warning">
          contract not deployed yet — run <code>npm run deploy</code> after funding the deployer
        </p>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Badges minted: <span className="text-foreground">{totalMinted ?? "—"}</span> · one per
        wallet · non-transferable · mint requires passing a {PASS}/5 quiz.
      </p>

      {phase === "minted" && (
        <section className="mt-6 rounded-lg border border-success/40 bg-card p-6 text-center">
          <p className="text-3xl" aria-hidden>
            ▮
          </p>
          <h2 className="mt-2 text-sm font-bold text-foreground">Badge #{badgeId}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            already minted to this wallet — soulbound, yours forever
          </p>
        </section>
      )}

      {phase === "passed" && (
        <section className="mt-6 rounded-lg border border-primary/50 bg-card p-6 text-center">
          <h2 className="text-sm font-bold text-foreground">Quiz passed — {score}/5</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            the backend issued a signed voucher for your wallet. Mint to claim the badge.
          </p>
          <button
            onClick={mint}
            disabled={busy}
            className="mt-4 rounded bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {busy ? "minting…" : "Mint badge"}
          </button>
        </section>
      )}

      {phase === "quiz" && (
        <section className="mt-6 rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-bold text-foreground">The BOT Chain quiz</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            answer {QUESTIONS.length} questions — {PASS} correct earns the mint voucher.
          </p>
          <ol className="mt-4 space-y-5">
            {QUESTIONS.map((q, qi) => (
              <li key={qi}>
                <p className="text-xs text-foreground">
                  {qi + 1}. {q.q}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {q.options.map((o, oi) => (
                    <button
                      key={oi}
                      onClick={() =>
                        setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))
                      }
                      aria-pressed={answers[qi] === oi}
                      className={`rounded border px-2 py-1.5 text-left text-[11px] transition-colors ${
                        answers[qi] === oi
                          ? "border-primary text-primary"
                          : "border-border text-secondary hover:border-secondary"
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ol>
          <button
            onClick={submitQuiz}
            disabled={busy || answers.includes(-1) || status !== "ready"}
            className="mt-5 w-full rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {busy ? "checking…" : "Submit answers"}
          </button>
        </section>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <WalletProvider chainId={NET.chainId} chainName={NET.name} rpc={NET.rpc} explorer={NET.explorer}>
      <div className="min-h-screen bg-surface text-foreground font-sans">
        <header className="mx-auto flex max-w-xl items-center justify-between px-4 pt-6">
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">
              <span className="text-primary">▮</span> BotBadge
            </h1>
            <p className="text-[11px] text-muted-foreground">
              learn-to-earn badge · BOT Chain mainnet
            </p>
          </div>
          <ConnectWalletButton />
        </header>
        <Quiz />
      </div>
      <Toaster />
    </WalletProvider>
  );
}
