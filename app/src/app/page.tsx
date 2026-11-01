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

/* The badge — the only dense object on the page. A carbon plate shot on the
   seamless canvas backdrop, like a product in the catalogue. */
function BadgeObject({ id }: { id?: number | null }) {
  return (
    <div className="mx-auto flex aspect-square w-44 flex-col items-center justify-between bg-carbon px-4 py-5 text-canvas sm:w-52">
      <p className="w-full text-left font-mono text-[9px] tracking-[0.3em] text-canvas/50">
        BOT-CHAIN · 677
      </p>
      <div className="flex h-24 w-24 items-center justify-center rounded-[50%] border border-canvas/80 sm:h-28 sm:w-28">
        <span className="text-2xl font-thin tracking-[0.25em] sm:text-3xl">BOT</span>
      </div>
      <p className="w-full text-right font-mono text-[9px] tracking-[0.3em] text-canvas/50">
        {id != null ? `NO. ${String(id).padStart(4, "0")}` : "SOULBOUND"}
      </p>
    </div>
  );
}

function SpecRow({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-t border-hairline py-2.5 last:border-b">
      <dt className="text-[10px] font-light uppercase tracking-[0.2em] text-muted-foreground">{k}</dt>
      <dd className={`text-xs font-light text-foreground ${mono ? "font-mono" : ""}`}>{v}</dd>
    </div>
  );
}

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
    <main className="mx-auto max-w-3xl px-5 pb-24">
      {!DEPLOYED && (
        <p className="mt-6 border border-amber/50 bg-card px-4 py-3 text-xs font-light text-amber">
          contract not deployed yet — run <code>npm run deploy</code> after funding the deployer
        </p>
      )}

      {/* ——— the product shot ——— */}
      <section className="mt-10 border-y border-hairline py-12 sm:mt-14 sm:py-16">
        <div className="grid items-center gap-10 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-[10px] font-light uppercase tracking-[0.3em] text-muted-foreground">
              catalogue no. BOT-001 · BOT Chain mainnet
            </p>
            <h2 className="mt-4 text-4xl font-thin leading-[1.1] tracking-tight text-foreground sm:text-5xl">
              the badge is<br />the product.
            </h2>
            <p className="mt-5 max-w-sm text-[13px] font-light leading-relaxed text-secondary">
              A soulbound credential for people who actually know the chain they
              build on. Pass a five-question quiz, receive a signed voucher,
              mint the object — it stays bound to your wallet forever.
            </p>
          </div>
          <BadgeObject id={phase === "minted" ? badgeId : null} />
        </div>
      </section>

      {/* ——— spec sheet ——— */}
      <section className="mt-10">
        <h3 className="text-[10px] font-light uppercase tracking-[0.3em] text-muted-foreground">
          01 — specifications
        </h3>
        <dl className="mt-4">
          <SpecRow k="standard" v="ERC-721 · soulbound (non-transferable)" />
          <SpecRow k="chain" v={`BOT Chain · ${NET.chainId}`} mono />
          <SpecRow k="supply rule" v="one per wallet" />
          <SpecRow k="qualification" v={`${PASS}/${QUESTIONS.length} on the quiz`} />
          <SpecRow k="minted to date" v={totalMinted == null ? "—" : String(totalMinted)} mono />
          <SpecRow k="contract" v={`${CONTRACT_ADDRESS.slice(0, 10)}…${CONTRACT_ADDRESS.slice(-6)}`} mono />
        </dl>
      </section>

      {phase === "minted" && (
        <section className="mt-14 text-center">
          <h3 className="text-[10px] font-light uppercase tracking-[0.3em] text-muted-foreground">
            registered
          </h3>
          <p className="mt-4 text-2xl font-thin text-foreground">
            Badge No. {String(badgeId ?? 0).padStart(4, "0")}
          </p>
          <p className="mt-2 text-xs font-light text-secondary">
            already minted to this wallet — soulbound, yours forever
          </p>
        </section>
      )}

      {phase === "passed" && (
        <section className="mt-14 border-t border-ink pt-8">
          <h3 className="text-[10px] font-light uppercase tracking-[0.3em] text-muted-foreground">
            03 — claim
          </h3>
          <p className="mt-4 text-2xl font-thin text-foreground">
            qualified · {score}/{QUESTIONS.length}
          </p>
          <p className="mt-2 max-w-md text-xs font-light leading-relaxed text-secondary">
            the issuer signed a voucher bound to your wallet. present it to the
            contract to mint — the signature is the authorization.
          </p>
          <p className="mt-4 break-all font-mono text-[10px] leading-relaxed text-muted-foreground">
            {voucher.slice(0, 66)}…
          </p>
          <button
            onClick={mint}
            disabled={busy}
            className="mt-6 w-full bg-primary px-6 py-3.5 text-xs font-light uppercase tracking-[0.25em] text-primary-foreground hover:bg-primary-hover disabled:opacity-50 sm:w-auto sm:px-12"
          >
            {busy ? "minting…" : "Mint badge"}
          </button>
        </section>
      )}

      {phase === "quiz" && (
        <section className="mt-14">
          <h3 className="text-[10px] font-light uppercase tracking-[0.3em] text-muted-foreground">
            02 — qualification
          </h3>
          <p className="mt-3 text-xs font-light text-secondary">
            answer {QUESTIONS.length} questions — {PASS} correct earns the mint voucher.
          </p>
          <ol className="mt-8 space-y-10">
            {QUESTIONS.map((q, qi) => (
              <li key={qi}>
                <p className="text-sm font-light text-foreground">
                  <span className="mr-3 font-mono text-[10px] text-muted-foreground">
                    {String(qi + 1).padStart(2, "0")}
                  </span>
                  {q.q}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-px bg-hairline sm:grid-cols-4">
                  {q.options.map((o, oi) => (
                    <button
                      key={oi}
                      onClick={() =>
                        setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))
                      }
                      aria-pressed={answers[qi] === oi}
                      className={`bg-canvas px-3 py-2.5 text-left text-[11px] font-light transition-colors ${
                        answers[qi] === oi
                          ? "bg-carbon text-canvas"
                          : "text-secondary hover:bg-hairline/60 hover:text-foreground"
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
            className="mt-10 w-full bg-primary px-4 py-3.5 text-xs font-light uppercase tracking-[0.25em] text-primary-foreground hover:bg-primary-hover disabled:opacity-40"
          >
            {busy ? "checking…" : "Submit answers"}
          </button>
          {status !== "ready" && (
            <p className="mt-3 text-center text-[11px] font-light text-muted-foreground">
              connect your wallet to submit
            </p>
          )}
        </section>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <WalletProvider chainId={NET.chainId} chainName={NET.name} rpc={NET.rpc} explorer={NET.explorer}>
      <div className="min-h-screen bg-canvas text-foreground font-sans">
        <header className="mx-auto flex max-w-3xl items-center justify-between px-5 pt-6">
          <div>
            <h1 className="text-sm font-light uppercase tracking-[0.35em] text-foreground">
              BotBadge
            </h1>
            <p className="mt-1 text-[10px] font-light uppercase tracking-[0.2em] text-muted-foreground">
              learn-to-earn · BOT Chain
            </p>
          </div>
          <ConnectWalletButton />
        </header>
        <Quiz />
        <footer className="mt-4 bg-carbon text-canvas">
          <div className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bot-chain.svg" alt="BOT Chain" className="h-5 w-auto" />
              <p className="text-[10px] font-light uppercase tracking-[0.2em] text-canvas/50">
                issued on BOT Chain
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-light text-canvas/70">
              <a href="https://www.botchain.ai" target="_blank" rel="noopener noreferrer" className="hover:text-canvas">
                botchain.ai ↗
              </a>
              <a href={NET.explorer} target="_blank" rel="noopener noreferrer" className="hover:text-canvas">
                BOT Chain Explorer ↗
              </a>
              <a
                href={`${NET.explorer}/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono hover:text-canvas"
              >
                {`${CONTRACT_ADDRESS.slice(0, 10)}…${CONTRACT_ADDRESS.slice(-6)}`}
              </a>
            </nav>
          </div>
        </footer>
      </div>
      <Toaster />
    </WalletProvider>
  );
}
