# CredLend Solana (MVP)

A minimal borrowing/lending MVP on Solana built with Anchor. It supports user whitelisting, loan requests against USDT collateral, repayments, treasury deposits/withdrawals, and liquidation of overdue loans. Events are emitted for all key actions and the Anchor IDL is published on-chain for explorer interoperability.

## Program Overview

- Program ID: `EpqAoepRUWzcUNmdvTuWVeoXHTbmEKuZRhWobfAbornY`
- Core accounts
  - `ProgramConfig`: admin, treasury vault, USDT/USDC mints, and policy params (interest rate, min/max duration, max borrow %).
  - `TreasuryVault`: PDA used to sign SPL transfers from the treasury.
  - `WhitelistEntry`: marks a user as eligible to borrow.
  - `Loan`: per-borrower loan state, collateral and repayment amounts, due time.
  - `CollateralVault`: PDA that holds collateral SPL tokens per borrower.
- Instructions
  - `initialize(...)`: creates config + treasury vault, saves mints and policy.
  - `add_admin(new_admin_key)`: adds an admin entry PDA.
  - `whitelist_user(user_key)`: adds a whitelist entry PDA.
  - `remove_whitelist`: deletes a whitelist entry and returns rent.
  - `update_config(...)`: updates policy params in `ProgramConfig`.
  - `deposit_to_treasury(amount)`: transfers SOL and SPL from admin to treasury.
  - `withdraw_from_treasury(amount)`: transfers SPL from treasury to admin (signed by vault PDA).
  - `request_loan(collateral_amount, loan_amount, loan_duration_sec, requested_loan_mint)`: transfers collateral to vault and disburses loan from treasury; computes repayment and due time.
  - `repay_loan()`: transfers repayment to treasury and unlocks collateral.
  - `liquidate_loan()`: moves collateral to treasury when loan is overdue.
- Events
  - Emitted for initialize, admin/whitelist changes, config updates, treasury deposits/withdrawals, loan request/repay/liquidate. These aid indexing and explorer display.

## Setup & Testing

Prerequisites
- Solana CLI and Anchor installed
- Node.js 18+ and yarn
- Wallet funded on the chosen cluster (Devnet/Testnet/Mainnet)

Configure
- The deploy script sets Solana CLI for each run. Verify:
  - `solana config get` should show the intended `RPC URL`, `Keypair Path`, and `Commitment: confirmed`.
- Program ID in `Anchor.toml`:
  - `credlend_solana = "EpqAoepRUWzcUNmdvTuWVeoXHTbmEKuZRhWobfAbornY"`

Build & Deploy
- Localnet
  - `bash credlend-solana/scripts/deploy.sh localnet`
  - Starts a local validator if needed, builds, deploys, publishes IDL locally.
- Devnet
  - `bash credlend-solana/scripts/deploy.sh devnet [~/.config/solana/id.json]`
  - Pre-creates and logs USDT/USDC mints. Deploys and publishes on-chain IDL.
- Testnet
  - `bash credlend-solana/scripts/deploy.sh testnet [~/.config/solana/id.json]`
  - Same behavior as Devnet.
- Mainnet
  - `bash credlend-solana/scripts/deploy.sh mainnet /path/to/mainnet-keypair.json`
  - Skips test mints; deploys and publishes IDL.

Mints
- Devnet/Testnet mints are saved to `mints/<cluster>-mints.json` and reused across runs.
- Example (Testnet):
  - `{"usdtMint":"68N9pDszqUcWwEt7uezJL1HL1YgVGQqzFroEuKRm4adj","usdcMint":"Djbvj7oMKWQjioSb38UtaNmSTbKnUwpFmr6Q88oYmq9f","decimals":6}`

Testing with SPL Token
- Create token accounts for your wallet:
  - `spl-token create-account <USDT_MINT>`
  - `spl-token create-account <USDC_MINT>`
- Mint for testing:
  - `spl-token mint <USDT_MINT> 1000000` (1 USDT with 6 decimals)
- Transfers and balances:
  - `spl-token transfer <USDT_MINT> <AMOUNT> <RECIPIENT_TOKEN_ACCOUNT>`
  - `spl-token balance <USDT_MINT>`

Run Client Tests
- `anchor test` executes `tests/credlend-solana.ts` against Localnet.
- Ensure the local validator is up or use the deploy script with `localnet` first.

IDL Publishing
- The deploy script initializes or upgrades the on-chain IDL automatically.
- Manual commands:
  - `anchor idl fetch EpqAoepRUWzcUNmdvTuWVeoXHTbmEKuZRhWobfAbornY --provider.cluster <Cluster>`
  - `anchor idl upgrade EpqAoepRUWzcUNmdvTuWVeoXHTbmEKuZRhWobfAbornY -f credlend-solana/target/idl/credlend_solana.json --provider.cluster <Cluster>`

## NextJS Integration

Install client dependencies (example using `@coral-xyz/anchor`):
```bash
npm install @solana/web3.js @coral-xyz/anchor
```

Load the IDL and connect:
```ts
// lib/solana.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, Idl, Wallet } from '@coral-xyz/anchor';
import idlJson from '../idl/credlend_solana.json';

export const PROGRAM_ID = new PublicKey('EpqAoepRUWzcUNmdvTuWVeoXHTbmEKuZRhWobfAbornY');
export const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC ?? 'https://api.devnet.solana.com';

export function getProvider(wallet: Wallet) {
  const connection = new Connection(RPC_URL, 'confirmed');
  return new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
}

export function getProgram(provider: AnchorProvider) {
  return new Program(idlJson as Idl, PROGRAM_ID, provider);
}
```

Example: call `initialize` from a NextJS page or API route:
```ts
// app/actions/initialize.ts
import { getProvider, getProgram } from '@/lib/solana';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';

export async function initializeProgram(wallet: Wallet, params: {
  interestRateBps: number;
  maxBorrowPctBps: number;
  minLoanDurationSec: number;
  maxLoanDurationSec: number;
  usdtMint: string;
  usdcMint: string;
}) {
  const provider = getProvider(wallet);
  const program = getProgram(provider);

  const [treasuryVault] = await PublicKey.findProgramAddress(
    [Buffer.from('treasury')],
    program.programId,
  );

  const programConfig = PublicKey.findProgramAddressSync(
    [Buffer.from('program-config')], // if you introduce a seed for config later
    program.programId,
  )[0];

  return program.methods
    .initialize(
      params.interestRateBps,
      params.maxBorrowPctBps,
      params.minLoanDurationSec,
      params.maxLoanDurationSec,
    )
    .accounts({
      programConfig,
      treasuryVault,
      usdtMint: new PublicKey(params.usdtMint),
      usdcMint: new PublicKey(params.usdcMint),
      admin: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}
```

Request a loan (simplified):
```ts
// app/actions/request-loan.ts
import { getProvider, getProgram } from '@/lib/solana';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';

export async function requestLoan(wallet: Wallet, args: {
  collateralAmount: number;
  loanAmount: number;
  loanDurationSec: number;
  loanMint: string;
  borrowerTokenAccount: string;
  treasuryTokenAccount: string;
  collateralTokenAccount: string;
}) {
  const provider = getProvider(wallet);
  const program = getProgram(provider);

  const borrower = provider.wallet.publicKey;
  const loanPda = PublicKey.findProgramAddressSync([
    Buffer.from('loan'), borrower.toBuffer(),
  ], program.programId)[0];
  const collateralVaultPda = PublicKey.findProgramAddressSync([
    Buffer.from('collateral'), borrower.toBuffer(),
  ], program.programId)[0];

  return program.methods
    .requestLoan(new anchor.BN(args.collateralAmount), new anchor.BN(args.loanAmount), args.loanDurationSec, new PublicKey(args.loanMint))
    .accounts({
      loan: loanPda,
      collateralVault: collateralVaultPda,
      borrower,
      borrowerTokenAccount: new PublicKey(args.borrowerTokenAccount),
      treasuryTokenAccount: new PublicKey(args.treasuryTokenAccount),
      collateralTokenAccount: new PublicKey(args.collateralTokenAccount),
      treasuryVault: /* set treasury vault PDA from config */ borrower, // placeholder
      programConfig: /* load ProgramConfig */ borrower, // placeholder
      whitelistEntry: /* load WhitelistEntry */ borrower, // placeholder
      tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}
```

Frontend wiring
- Provide wallet adapter (e.g., `@solana/wallet-adapter` for React).
- Store and load mint addresses from your environment (`NEXT_PUBLIC_USDT_MINT`, `NEXT_PUBLIC_USDC_MINT`).
- Handle PDAs and account lookups server-side or via a small client SDK.
- Subscribe to program logs via `Connection.onLogs` or index events using a webhook/indexer.

Deployment integration
- After deploy, export mint addresses to `.env` for your NextJS app:
  - `NEXT_PUBLIC_USDT_MINT=68N9pDszqUcWwEt7uezJL1HL1YgVGQqzFroEuKRm4adj`
  - `NEXT_PUBLIC_USDC_MINT=Djbvj7oMKWQjioSb38UtaNmSTbKnUwpFmr6Q88oYmq9f`
- Point `NEXT_PUBLIC_SOLANA_RPC` to your chosen cluster.

## Troubleshooting
- "No data" in explorer IDL view: rerun the deploy script to publish IDL for the target cluster.
- Insufficient SOL errors: fund the deploy wallet (Devnet/Testnet/Mainnet).
- Localnet issues: ensure the validator is running; try `solana-test-validator --reset`.
- PDAs and accounts: confirm seeds and constraints match in code; inspect transaction logs for `require!` failures.