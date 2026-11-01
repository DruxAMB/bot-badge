# Design system — BotBadge

**Source:** [teenage engineering](https://teenage.engineering) via
[styles.refero.design](https://styles.refero.design/style/aecf9dda-5cba-4dc7-9e73-59b65d895cdf)
— "industrial catalogue under studio light: the product is the only rich
object on the page and everything else is whispered around it."

**Theme:** light · canvas mist

## Why this system for a badge dApp

The product IS a badge — a collectible object. teenage engineering's whole
register is "one photographed object on a seamless field, everything else
whispered", so the minted badge becomes the hero shot and the rest of the
page is its spec sheet. It is also maximally distinct from the sibling
projects (AgentID: dark Dimension; ProofOfAI: dope.security; CreatorTips:
Monzo).

## Translation choices

- **Palette:** Canvas Mist `#f6f8f7` field, Ink `#000` text + rules, Carbon
  `#0f0e12` (violet-cast near-black) for the badge plate, footer band, and
  primary-action fills. Steel Gray `#e5e5e5` hairlines, `#b2b2b2` for
  decorative rules only.
- **Zero radius** everywhere — every edge is a straight cut (the badge's
  inner medal ring is the single circle, `rounded-[50%]`).
- **Type:** Inter at 100/300 substitutes for te-20/te-40. Weight 300 is the
  readable floor; 100/200 reserved for display and meta. JetBrains Mono for
  serials, hashes, addresses.
- **One chromatic note:** amber `#c98a04`, used only for the
  warning/not-deployed state — mirroring the source's lone amber triangle.
- **Structure:** hairline-ruled bands instead of cards; a "01 —
  specifications" dl spec sheet; quiz options as hairline-divided cells
  (`gap-px` grid), selection = inverted carbon fill; footer = the
  catalogue's dark display-case wall carrying the BOT Chain wordmark,
  botchain.ai, explorer, and contract links.
- **The badge object** (`BadgeObject`): CSS-built carbon plate —
  `BOT-CHAIN · 677` header, ring medallion, `SOULBOUND`/`NO. nnnn` serial —
  shot on the seamless backdrop.

## Substitutions

| Source | Used | Why |
|---|---|---|
| Muted text `#b2b2b2` | `#555` secondary / `#767` meta | Source value fails WCAG for text; kept for decorative rules only |
| te-20/te-40 fonts | Inter 100–500, JB Mono | Licensed-available substitutes |
| Amber triangle | `#c98a04` on warning states | Keeps the single-chromatic-note discipline |
| Pure-black text | kept `#000` | Canonical — ink is the anchor |
