# BotBadge — Learn-to-Earn Badge on BOT Chain

A free, non-transferable (soulbound) ERC-721 badge earned by passing a short
5-question quiz about BOT Chain. One badge per wallet.

## Contract

`contracts/BotBadge.sol` — UUPS-upgradeable ERC-721.

- `mint(voucher)` — requires an EIP-191 signature from the quiz backend over
  `keccak256(contract, chainId, recipient)`; one per wallet (`already minted`)
- transfers blocked in `_update` (mint and burn remain possible)
- `badgeOf(addr)`, `hasMinted(addr)`, `totalMinted()`
- `setVoucherSigner(addr)` — owner only

## The voucher backend

`app/src/app/api/voucher/route.ts` — scores the 5 answers server-side
(≥4/5 passes) and returns the mint signature. Configure a dedicated signing
key — **not the deployer/treasury key**:

```bash
node -e "console.log(require('ethers').Wallet.createRandom().privateKey)"
# app/.env.local:  VOUCHER_KEY=0x…   (the derived address is VOUCHER_SIGNER below)
```

## Contract deps

`contracts/lib/` vendors OpenZeppelin + forge-std (gitignored — copy from
`bot-oracle/contracts/lib` or `forge install` if Foundry is available).

## Deploy

```bash
npm install
cp .env.example .env           # DEPLOYER_KEY + OWNER_ADDRESS + VOUCHER_SIGNER
npm run deploy                 # proxy is the permanent address
```

## App

```bash
cd app && npm install && npm run dev
```

Quiz → server-verified voucher → Mint button → minted state with badge number,
total minted counter.
