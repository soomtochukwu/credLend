#!/usr/bin/env bash
set -euo pipefail

# Deploy Anchor workspace to a selected cluster.
# Usage:
#   bash scripts/deploy.sh <localnet|devnet|testnet|mainnet> [wallet_path]
# Examples:
#   bash scripts/deploy.sh localnet
#   bash scripts/deploy.sh devnet ~/.config/solana/id.json
#   bash scripts/deploy.sh mainnet /path/to/wallet.json

CLUSTER_INPUT=${1:-}
WALLET_INPUT=${2:-"$HOME/.config/solana/id.json"}

if [[ -z "$CLUSTER_INPUT" ]]; then
  echo "Usage: $0 <localnet|devnet|testnet|mainnet> [wallet_path]"
  exit 1
fi

# Normalize cluster input to Anchor's canonical names
lower=${CLUSTER_INPUT,,}
case "$lower" in
  local|localnet)
    CLUSTER_NAME="Localnet"
    ;;
  dev|devnet)
    CLUSTER_NAME="Devnet"
    ;;
  test|testnet)
    CLUSTER_NAME="Testnet"
    ;;
  main|mainnet|mainnet-beta)
    CLUSTER_NAME="Mainnet"
    ;;
  *)
    echo "Unknown cluster: $CLUSTER_INPUT"
    echo "Valid: localnet, devnet, testnet, mainnet"
    exit 1
    ;;
esac

echo "Cluster: $CLUSTER_NAME"
echo "Wallet: $WALLET_INPUT"

if [[ ! -f "$WALLET_INPUT" ]]; then
  echo "Wallet not found at $WALLET_INPUT"
  exit 1
fi

# Move to workspace root (this script lives in credlend-solana/scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
cd "$WORKSPACE_DIR"

# Set Solana CLI config to selected cluster and wallet
case "$CLUSTER_NAME" in
  Localnet)
    RPC_URL="http://127.0.0.1:8899"
    ;;
  Devnet)
    RPC_URL="https://api.devnet.solana.com"
    ;;
  Testnet)
    RPC_URL="https://api.testnet.solana.com"
    ;;
  Mainnet)
    RPC_URL="https://api.mainnet-beta.solana.com"
    ;;
  *)
    echo "Unexpected cluster name: $CLUSTER_NAME"
    exit 1
    ;;
esac

echo "Setting Solana CLI config: url=$RPC_URL, wallet=$WALLET_INPUT"
solana config set -u "$RPC_URL" -k "$WALLET_INPUT" >/dev/null
solana config set --commitment confirmed >/dev/null
solana config get

# Export Anchor env so .anchor/deploy.ts uses correct cluster and wallet
export ANCHOR_PROVIDER_URL="$RPC_URL"
export ANCHOR_WALLET="$WALLET_INPUT"

# Pre-create USDT/USDC test mints on Devnet/Testnet so they persist even if deploy fails
if [[ "$CLUSTER_NAME" == "Devnet" || "$CLUSTER_NAME" == "Testnet" ]]; then
  echo "Ensuring USDT/USDC test mints exist for $CLUSTER_NAME..."
  MINTS_FILE="$WORKSPACE_DIR/mints/${lower}-mints.json"
  set +e
  anchor migrate --provider.cluster "$CLUSTER_NAME" --provider.wallet "$WALLET_INPUT"
  MIGRATE_EXIT=$?
  set -e

  USDT_JSON=$(grep -o '"usdtMint":"[^"]*"' "$MINTS_FILE" 2>/dev/null | head -n 1 | sed -E 's/.*:"([^"]*)"/\1/')
  USDC_JSON=$(grep -o '"usdcMint":"[^"]*"' "$MINTS_FILE" 2>/dev/null | head -n 1 | sed -E 's/.*:"([^"]*)"/\1/')

  if [[ $MIGRATE_EXIT -ne 0 || -z "$USDT_JSON" || -z "$USDC_JSON" ]]; then
    echo "Anchor migrate failed or mints JSON invalid; attempting CLI fallback..."

    # Create USDT mint via spl-token and parse the mint address robustly
    USDT_OUT=$(spl-token create-token --decimals 6 2>&1)
    USDT_MINT=$(echo "$USDT_OUT" | grep -Eo 'Creating token [1-9A-HJ-NP-Za-km-z]{32,44}' | awk '{print $3}' | head -n 1)
    if [[ -z "$USDT_MINT" ]]; then
      USDT_MINT=$(echo "$USDT_OUT" | grep -Eo '[1-9A-HJ-NP-Za-km-z]{32,44}' | head -n 1)
    fi

    # Create USDC mint via spl-token and parse the mint address robustly
    USDC_OUT=$(spl-token create-token --decimals 6 2>&1)
    USDC_MINT=$(echo "$USDC_OUT" | grep -Eo 'Creating token [1-9A-HJ-NP-Za-km-z]{32,44}' | awk '{print $3}' | head -n 1)
    if [[ -z "$USDC_MINT" ]]; then
      USDC_MINT=$(echo "$USDC_OUT" | grep -Eo '[1-9A-HJ-NP-Za-km-z]{32,44}' | head -n 1)
    fi

    if [[ -z "$USDT_MINT" || -z "$USDC_MINT" ]]; then
      echo "Error: failed to extract mint addresses from spl-token output:\nUSDT:\n$USDT_OUT\nUSDC:\n$USDC_OUT"
      echo "Please ensure the wallet is funded and RPC accessible, then retry."
      # Do not exit; proceed to write whatever we have for visibility
    fi

    mkdir -p "$WORKSPACE_DIR/mints"
    echo "{\"usdtMint\":\"$USDT_MINT\",\"usdcMint\":\"$USDC_MINT\",\"decimals\":6}" > "$MINTS_FILE"
    echo "Mint addresses written to $MINTS_FILE:"
    cat "$MINTS_FILE"
  else
    echo "Mint addresses written to $MINTS_FILE:"
    cat "$MINTS_FILE"
  fi
fi

# If localnet, ensure a local validator is running before deploy
if [[ "$CLUSTER_NAME" == "Localnet" ]]; then
  echo "Ensuring local validator is running..."
  if ! solana -u http://127.0.0.1:8899 cluster-version >/dev/null 2>&1; then
    echo "Starting local validator..."
    nohup solana-test-validator --reset >/dev/null 2>&1 &
    # Wait up to ~30s for RPC to come up
    for i in {1..30}; do
      if solana -u http://127.0.0.1:8899 cluster-version >/dev/null 2>&1; then
        echo "Local validator is up."
        break
      fi
      sleep 1
    done
    if ! solana -u http://127.0.0.1:8899 cluster-version >/dev/null 2>&1; then
      echo "Failed to start local validator within timeout."
      exit 1
    fi
  else
    echo "Local validator already running."
  fi
fi

# Build the workspace
echo "Building workspace..."
anchor build

# Deploy to the selected cluster
echo "Deploying to $CLUSTER_NAME..."
anchor deploy --provider.cluster "$CLUSTER_NAME" --provider.wallet "$WALLET_INPUT"

# Run migration only on devnet/testnet (migrations/deploy.ts)
if [[ -f "$WORKSPACE_DIR/migrations/deploy.ts" ]]; then
  if [[ "$CLUSTER_NAME" == "Devnet" || "$CLUSTER_NAME" == "Testnet" ]]; then
    MINTS_FILE="$WORKSPACE_DIR/mints/${lower}-mints.json"
    if [[ -f "$MINTS_FILE" ]]; then
      echo "Mint addresses (post-deploy) in $MINTS_FILE:"
      cat "$MINTS_FILE"
    else
      echo "Note: mints file not found; pre-migration may have failed earlier."
    fi
  else
    echo "Skipping migration on $CLUSTER_NAME (no test mints on localnet/mainnet)."
  fi
fi

# Publish Anchor IDL on-chain for explorers on all clusters (Localnet/Devnet/Testnet/Mainnet)
PROGRAM_NAME="credlend_solana"
IDL_PATH="$WORKSPACE_DIR/target/idl/${PROGRAM_NAME}.json"
PROGRAM_ID=$(grep -Eo "${PROGRAM_NAME}\s*=\s*\"[^\"]+\"" "$WORKSPACE_DIR/Anchor.toml" | sed -E 's/.*=\s*\"([^\"]+)\"/\1/' | head -n 1)

if [[ -z "$PROGRAM_ID" ]]; then
  echo "Warning: could not parse program id from Anchor.toml for $PROGRAM_NAME"
else
  echo "Program ID detected: $PROGRAM_ID"
fi

if [[ ! -f "$IDL_PATH" ]]; then
  echo "IDL file not found at $IDL_PATH, rebuilding to generate it..."
  anchor build
fi

echo "Publishing IDL to $CLUSTER_NAME for program $PROGRAM_ID..."
set +e
anchor idl fetch "$PROGRAM_ID" --provider.cluster "$CLUSTER_NAME" >/dev/null 2>&1
FETCH_EXIT=$?
set -e
if [[ $FETCH_EXIT -ne 0 ]]; then
  echo "No on-chain IDL found; initializing..."
  anchor idl init "$PROGRAM_ID" -f "$IDL_PATH" --provider.cluster "$CLUSTER_NAME" --provider.wallet "$WALLET_INPUT"
else
  echo "On-chain IDL exists; upgrading..."
  anchor idl upgrade "$PROGRAM_ID" -f "$IDL_PATH" --provider.cluster "$CLUSTER_NAME" --provider.wallet "$WALLET_INPUT"
fi

echo "IDL fetch preview:"
anchor idl fetch "$PROGRAM_ID" --provider.cluster "$CLUSTER_NAME" | head -n 12 || true

echo "Deployment completed to $CLUSTER_NAME"