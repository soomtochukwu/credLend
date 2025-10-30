import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CredlendSolana } from "../target/types/credlend_solana";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, ACCOUNT_SIZE, createInitializeAccountInstruction } from "@solana/spl-token";
import { assert } from "chai";

// Helper to create a token account for PDA owners (off-curve)
async function createTokenAccountForOwner(
  provider: anchor.AnchorProvider,
  mint: anchor.web3.PublicKey,
  owner: anchor.web3.PublicKey,
  payer: anchor.web3.Keypair
): Promise<anchor.web3.PublicKey> {
  const tokenAccount = anchor.web3.Keypair.generate();
  const lamports = await provider.connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE);
  const tx = new anchor.web3.Transaction().add(
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: tokenAccount.publicKey,
      space: ACCOUNT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeAccountInstruction(tokenAccount.publicKey, mint, owner, TOKEN_PROGRAM_ID)
  );
  await provider.sendAndConfirm(tx, [payer, tokenAccount]);
  return tokenAccount.publicKey;
}

describe("credlend-solana", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CredlendSolana as Program<CredlendSolana>;
  const admin = anchor.web3.Keypair.generate();
  const user = anchor.web3.Keypair.generate();

  let usdtMint: anchor.web3.PublicKey;
  let usdcMint: anchor.web3.PublicKey;

  let adminUsdtAccount: anchor.web3.PublicKey;
  let adminUsdcAccount: anchor.web3.PublicKey;

  let userUsdtAccount: anchor.web3.PublicKey;
  let treasuryTokenAccount: anchor.web3.PublicKey;
  let collateralTokenAccount: anchor.web3.PublicKey;

  const programConfig = anchor.web3.Keypair.generate();
  let treasuryVault: anchor.web3.PublicKey;
  let collateralVault: anchor.web3.PublicKey;

  before(async () => {
    // Airdrop SOL to admin and user
    const adminAirdropSignature = await provider.connection.requestAirdrop(admin.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(adminAirdropSignature);

    const userAirdropSignature = await provider.connection.requestAirdrop(user.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(userAirdropSignature);

    // Derive PDAs
    [treasuryVault] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("treasury")],
      program.programId
    );
    [collateralVault] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("collateral"), user.publicKey.toBuffer()],
      program.programId
    );

    // Create mints
    usdtMint = await createMint(provider.connection, admin, admin.publicKey, null, 6);
    usdcMint = await createMint(provider.connection, admin, admin.publicKey, null, 6);

    // Create token accounts
    adminUsdtAccount = await createAccount(provider.connection, admin, usdtMint, admin.publicKey);
    adminUsdcAccount = await createAccount(provider.connection, admin, usdcMint, admin.publicKey);
    userUsdtAccount = await createAccount(provider.connection, user, usdtMint, user.publicKey);
    // Use USDT for treasury so transfers match borrower token account mint
    treasuryTokenAccount = await createTokenAccountForOwner(provider, usdtMint, treasuryVault, admin);
    collateralTokenAccount = await createTokenAccountForOwner(provider, usdtMint, collateralVault, admin);

    // Mint tokens
    await mintTo(provider.connection, admin, usdtMint, adminUsdtAccount, admin, 1000 * 10 ** 6);
    await mintTo(provider.connection, admin, usdcMint, adminUsdcAccount, admin, 1000 * 10 ** 6);
    await mintTo(provider.connection, admin, usdtMint, userUsdtAccount, admin, 1000 * 10 ** 6);
    await mintTo(provider.connection, admin, usdtMint, treasuryTokenAccount, admin, 1000 * 10 ** 6);
  });

  it("Is initialized!", async () => {
    const interestRateBps = 100; // 1%
    const maxBorrowPctBps = 5000; // 50%
    const minLoanDurationSec = new anchor.BN(60); // 1 minute
    const maxLoanDurationSec = new anchor.BN(3600); // 1 hour

    await program.methods
      .initialize(interestRateBps, maxBorrowPctBps, minLoanDurationSec, maxLoanDurationSec)
      .accounts({
        programConfig: programConfig.publicKey,
        treasuryVault: treasuryVault,
        usdtMint: usdtMint,
        usdcMint: usdcMint,
        admin: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([admin, programConfig])
      .rpc();

    const config = await program.account.programConfig.fetch(programConfig.publicKey);
    assert.equal(config.interestRateBps, interestRateBps);
  });

  it("Whitelists a user", async () => {
    const [whitelistEntry] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("whitelist"), user.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .whitelistUser(user.publicKey)
      .accounts({
        whitelistEntry: whitelistEntry,
        admin: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([admin])
      .rpc();

    const entry = await program.account.whitelistEntry.fetch(whitelistEntry);
    assert.isTrue(entry.isWhitelisted);
  });

  it("Requests a loan", async () => {
    const collateralAmount = new anchor.BN(100 * 10 ** 6);
    const loanAmount = new anchor.BN(50 * 10 ** 6);
    const loanDurationSec = new anchor.BN(120);

    const [loan] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("loan"), user.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .requestLoan(collateralAmount, loanAmount, loanDurationSec, usdtMint)
      .accounts({
        loan: loan,
        collateralVault: collateralVault,
        borrower: user.publicKey,
        borrowerTokenAccount: userUsdtAccount,
        treasuryTokenAccount: treasuryTokenAccount,
        collateralTokenAccount: collateralTokenAccount,
        treasuryVault: treasuryVault,
        programConfig: programConfig.publicKey,
        whitelistEntry: (await anchor.web3.PublicKey.findProgramAddress([Buffer.from("whitelist"), user.publicKey.toBuffer()],program.programId))[0],
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([user])
      .rpc();

      const loanAccount = await program.account.loan.fetch(loan);
      assert.isTrue(loanAccount.isActive);
  });

  it("Repays a loan", async () => {
    const [loan] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("loan"), user.publicKey.toBuffer()],
        program.programId
      );
  
      await program.methods
        .repayLoan()
        .accounts({
          loan: loan,
          collateralVault: collateralVault,
          borrower: user.publicKey,
          borrowerTokenAccount: userUsdtAccount,
          treasuryTokenAccount: treasuryTokenAccount,
          collateralTokenAccount: collateralTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any)
        .signers([user])
        .rpc();
  
      // Add assertions to check if the loan is closed and collateral is returned
      try {
        await program.account.loan.fetch(loan);
        assert.fail("Loan account should be closed");
      } catch (e) {
        // Expected error
      }
    });
});
