// Migration: create test mints on devnet/testnet and write addresses to mints/<cluster>-mints.json.
// Does NOT initialize the credlend program.

const anchor = require("@coral-xyz/anchor");
const { createMint } = require("@solana/spl-token");
const fs = require("fs");
const path = require("path");

module.exports = async function (provider) {
  anchor.setProvider(provider);
  const connection = provider.connection;
  const wallet = provider.wallet;

  const endpoint = connection.rpcEndpoint || process.env.ANCHOR_PROVIDER_URL || "";
  const isDevnet = endpoint.includes("devnet.solana.com");
  const isTestnet = endpoint.includes("testnet.solana.com");
  const isLocalnet = endpoint.includes("127.0.0.1") || endpoint.includes("localhost");
  const clusterName = isDevnet ? "devnet" : isTestnet ? "testnet" : isLocalnet ? "localnet" : "mainnet";

  if (!(isDevnet || isTestnet)) {
    console.log(`[migrations] Skipping test mint setup on ${clusterName}.`);
    return;
  }

  const mintsDir = path.join(__dirname, "..", "mints");
  const outFile = path.join(mintsDir, `${clusterName}-mints.json`);
  fs.mkdirSync(mintsDir, { recursive: true });

  // If mints file exists, reuse and show it
  if (fs.existsSync(outFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outFile, "utf8"));
      console.log(`[migrations] Using existing ${clusterName} mints: ${outFile}`);
      console.log(`[migrations] USDT mint: ${existing.usdtMint}`);
      console.log(`[migrations] USDC mint: ${existing.usdcMint}`);
      return;
    } catch (e) {
      console.warn(`[migrations] Failed to read existing mints file, will recreate: ${e.message}`);
    }
  }

  const decimals = 6;
  const mintAuthority = wallet.publicKey; // mint authority is the deployer wallet

  console.log(`[migrations] Creating ${clusterName} test mints (decimals=${decimals})...`);
  const usdtMintPk = await createMint(connection, wallet.payer, mintAuthority, null, decimals);
  const usdcMintPk = await createMint(connection, wallet.payer, mintAuthority, null, decimals);

  const payload = {
    usdtMint: usdtMintPk.toBase58(),
    usdcMint: usdcMintPk.toBase58(),
    decimals,
  };

  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf8");
  console.log(`[migrations] Wrote ${clusterName} mints to: ${outFile}`);
  console.log(`[migrations] USDT mint: ${payload.usdtMint}`);
  console.log(`[migrations] USDC mint: ${payload.usdcMint}`);
};
