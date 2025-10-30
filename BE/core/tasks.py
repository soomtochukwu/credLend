from celery import shared_task
from django.utils import timezone
from .utils.solana_client import solana_client
from loans.models import Loan, Repayment
import logging

logger = logging.getLogger(__name__)

@shared_task
def check_loan_repayments():
    """Check for overdue repayments and update status"""
    now = timezone.now()
    overdue_repayments = Repayment.objects.filter(
        due_date__lt=now,
        paid_at__isnull=True
    )
    
    for repayment in overdue_repayments:
        repayment.is_late = True
        repayment.save()
        
        # Check if loan should be marked as defaulted
        loan = repayment.loan
        if loan.status == 'active':
            # Check if grace period has passed
            grace_period_end = repayment.due_date + timezone.timedelta(days=7)  # 7-day grace period
            if now > grace_period_end:
                loan.status = 'defaulted'
                loan.save()
                
                # Trigger collateral liquidation
                liquidate_loan_collateral.delay(loan.id)

@shared_task
def liquidate_loan_collateral(loan_id):
    """Liquidate collateral for a defaulted loan"""
    try:
        loan = Loan.objects.get(id=loan_id)
        if loan.status == 'defaulted' and loan.collateral_address:
            # Call Solana program to liquidate collateral
            tx_hash = solana_client.liquidate_collateral(loan.contract_address)
            if tx_hash:
                loan.status = 'liquidated'
                loan.liquidated_at = timezone.now()
                loan.save()
                logger.info(f"Collateral liquidated for loan {loan_id}: {tx_hash}")
            else:
                logger.error(f"Failed to liquidate collateral for loan {loan_id}")
    except Loan.DoesNotExist:
        logger.error(f"Loan {loan_id} not found for liquidation")
    except Exception as e:
        logger.error(f"Error liquidating collateral for loan {loan_id}: {e}")

@shared_task
def sync_blockchain_transactions():
    """Sync transaction statuses from blockchain"""
    # Implementation to update transaction statuses
    pass