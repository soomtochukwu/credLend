import base58
import logging
import json
import requests
from solana.rpc.api import Client
from solana.account import Account  # Changed from Keypair
from solana.publickey import PublicKey
from solana.transaction import Transaction
from solana.system_program import TransferParams, transfer
from django.conf import settings

logger = logging.getLogger(__name__)

class SolanaClient:
    def __init__(self):
        self.client = Client(settings.SOLANA_RPC_URL)
        # CHANGED: Use Account instead of Keypair in v0.20.0
        if settings.SOLANA_WALLET_PRIVATE_KEY:
            self.account = Account(base58.b58decode(settings.SOLANA_WALLET_PRIVATE_KEY))
        else:
            self.account = None

    def get_balance(self, public_key_str):
        """Get balance of a wallet"""
        try:
            public_key = PublicKey(public_key_str)
            # CHANGED: Simpler API call in v0.20.0
            balance = self.client.get_balance(public_key)
            return balance['result']['value'] / 10**9  # Convert lamports to SOL
        except Exception as e:
            logger.error(f"Error getting balance for {public_key_str}: {e}")
            return 0

    def send_transaction(self, transaction):
        """Send a transaction - CHANGED SIGNATURE"""
        try:
            # CHANGED: Different API in v0.20.0
            result = self.client.send_transaction(transaction, self.account)
            return result
        except Exception as e:
            logger.error(f"Error sending transaction: {e}")
            return None

    def confirm_transaction(self, tx_hash):
        """Confirm a transaction"""
        try:
            # CHANGED: Simpler API in v0.20.0
            result = self.client.confirm_transaction(tx_hash)
            return result
        except Exception as e:
            logger.error(f"Error confirming transaction {tx_hash}: {e}")
            return None

    def create_transfer_transaction(self, to_address, amount_lamports):
        """Create a transfer transaction - CHANGED API"""
        try:
            # CHANGED: Different transaction building in v0.20.0
            txn = Transaction()
            txn.add(transfer(
                TransferParams(
                    from_pubkey=self.account.public_key(),
                    to_pubkey=PublicKey(to_address),
                    lamports=amount_lamports
                )
            ))
            return txn
        except Exception as e:
            logger.error(f"Error creating transfer transaction: {e}")
            return None

    def create_loan_contract(self, loan_data):
        """Create a loan contract on Solana - NEEDS CUSTOM IMPLEMENTATION"""
        # This will depend on your specific Solana program
        # You'll need to create the instruction data manually
        try:
            # Example structure - adjust based on your program
            from solana.transaction import Transaction
            txn = Transaction()
            
            # Add your program-specific instructions here
            # You'll need to manually create the instruction data
            # based on your program's IDL/interface
            
            return txn
        except Exception as e:
            logger.error(f"Error creating loan contract: {e}")
            return None

    def liquidate_collateral(self, loan_address):
        """Liquidate collateral for a defaulted loan - NEEDS CUSTOM IMPLEMENTATION"""
        # This will depend on your specific Solana program
        try:
            # Create liquidation instruction
            txn = Transaction()
            
            # Add your program-specific liquidation instruction
            # based on your program's IDL/interface
            
            result = self.client.send_transaction(txn, self.account)
            return result['result'] if 'result' in result else None
        except Exception as e:
            logger.error(f"Error liquidating collateral: {e}")
            return None

# Singleton instance
solana_client = SolanaClient()