from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
import base58
from solana.publickey import PublicKey
from solana.account import Account
from .models import LoanApplication, Loan, Repayment
from .serializers import (
    LoanApplicationSerializer, 
    LoanSerializer, 
    RepaymentSerializer
)

class LoanApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = LoanApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LoanApplication.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        application = self.get_object()
        if application.status != 'draft':
            return Response(
                {'error': 'Application already submitted'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = 'submitted'
        application.save()
        
        # Trigger KYC verification if not already done
        if not request.user.kyc_verified:
            # Start KYC process
            pass
            
        return Response({'status': 'submitted'})

class LoanViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Loan.objects.filter(application__user=self.request.user)

class RepaymentViewSet(viewsets.ModelViewSet):
    serializer_class = RepaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Repayment.objects.filter(loan__application__user=self.request.user)

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        repayment = self.get_object()
        
        if repayment.paid_at is not None:
            return Response(
                {'error': 'Repayment already paid'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process payment on Solana using v0.20.0 API
        from core.utils.solana_client import solana_client
        
        try:
            # Validate that user has provided private key for signing
            if not hasattr(request.user, 'private_key') or not request.user.private_key:
                return Response(
                    {'error': 'User private key required for transaction signing'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate contract address exists
            if not repayment.loan.application.contract_address:
                return Response(
                    {'error': 'Loan contract address not found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create user account from private key for signing
            user_account = Account(base58.b58decode(request.user.private_key))
            
            # Create transfer transaction (v0.20.0 style)
            from solana.transaction import Transaction
            from solana.system_program import transfer, TransferParams
            
            txn = Transaction()
            txn.add(transfer(
                TransferParams(
                    from_pubkey=user_account.public_key(),
                    to_pubkey=PublicKey(repayment.loan.application.contract_address),
                    lamports=int(repayment.amount * 10**9)  # Convert to lamports
                )
            ))
            
            # Send transaction
            result = solana_client.client.send_transaction(txn, user_account)
            
            if result and 'result' in result:
                repayment.paid_at = timezone.now()
                repayment.tx_hash = result['result']
                repayment.save()
                
                # Update loan status
                loan = repayment.loan
                loan.amount_repaid += repayment.amount
                if loan.amount_repaid >= loan.total_due:
                    loan.status = 'repaid'
                loan.save()
                
                return Response({'status': 'paid', 'tx_hash': repayment.tx_hash})
            else:
                error_msg = result.get('error', {}).get('message', 'Transaction failed') if result else 'Transaction failed'
                return Response(
                    {'error': f'Transaction failed: {error_msg}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except ValueError as e:
            # Handle invalid public key or base58 decoding errors
            return Response(
                {'error': f'Invalid address format: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Payment error: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming repayments for the user"""
        upcoming_repayments = Repayment.objects.filter(
            loan__application__user=request.user,
            paid_at__isnull=True,
            due_date__gte=timezone.now()
        ).order_by('due_date')
        
        serializer = self.get_serializer(upcoming_repayments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue repayments for the user"""
        overdue_repayments = Repayment.objects.filter(
            loan__application__user=request.user,
            paid_at__isnull=True,
            due_date__lt=timezone.now()
        ).order_by('due_date') 
        
        serializer = self.get_serializer(overdue_repayments, many=True)
        return Response(serializer.data)