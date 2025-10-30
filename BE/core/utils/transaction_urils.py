from solana.transaction import Transaction
from solana.publickey import PublicKey
from solana.system_program import transfer, TransferParams
from solana.account import Account
import base58

def create_transfer_transaction(from_private_key, to_address, amount_lamports):
    """Helper to create transfer transactions in v0.20.0 style"""
    try:
        # Create account from private key
        account = Account(base58.b58decode(from_private_key))
        
        # Create transaction
        txn = Transaction()
        txn.add(transfer(
            TransferParams(
                from_pubkey=account.public_key(),
                to_pubkey=PublicKey(to_address),
                lamports=amount_lamports
            )
        ))
        
        return txn
    except Exception as e:
        print(f"Error creating transfer: {e}")
        return None