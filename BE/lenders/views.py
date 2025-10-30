from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal
from django.db import models
import base58
from solana.publickey import PublicKey
from solana.account import Account
from solana.transaction import Transaction
from solana.system_program import transfer, TransferParams
from core.utils.solana_client import solana_client
from .models import LenderPool, LenderDeposit, PoolAllocation
from .serializers import LenderPoolSerializer, LenderDepositSerializer, PoolAllocationSerializer

class LenderPoolViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LenderPoolSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only show active pools
        return LenderPool.objects.filter(is_active=True)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get detailed statistics for a pool"""
        pool = self.get_object()
        
        stats = {
            'pool_id': pool.id,
            'pool_name': pool.name,
            'total_liquidity': pool.total_liquidity,
            'available_liquidity': pool.available_liquidity,
            'utilization_rate': (pool.total_liquidity - pool.available_liquidity) / pool.total_liquidity * 100 if pool.total_liquidity > 0 else 0,
            'current_apy': pool.apy,
            'total_deposits': pool.deposits.count(),
            'active_deposits': pool.deposits.filter(withdrawn=False).count(),
            'total_allocated': pool.allocations.aggregate(total=models.Sum('amount'))['total'] or Decimal('0')
        }
        
        return Response(stats)

class LenderDepositViewSet(viewsets.ModelViewSet):
    serializer_class = LenderDepositSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own deposits
        return LenderDeposit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically set the user to the current user
        deposit = serializer.save(user=self.request.user)
        
        # Process the deposit transaction on Solana
        self._process_deposit_transaction(deposit)

    def _process_deposit_transaction(self, deposit):
        """Process deposit transaction on Solana blockchain"""
        try:
            # Get pool information
            pool = deposit.pool
            
            # Create transfer transaction
            txn = Transaction()
            txn.add(transfer(
                TransferParams(
                    from_pubkey=PublicKey(self.request.user.wallet_address),
                    to_pubkey=PublicKey(pool.token_address),
                    lamports=int(deposit.amount * 10**9)  # Convert to lamports
                )
            ))
            
            # Send transaction (user needs to sign this)
            # In a real implementation, this would be handled by the frontend
            # or through a signing service
            
            # For now, simulate transaction success
            deposit.deposit_tx_hash = f"simulated_tx_{deposit.id}"
            deposit.save()
            
        except Exception as e:
            # Handle transaction failure
            deposit.delete()  # Remove the deposit record if transaction fails
            raise serializers.ValidationError(f"Transaction failed: {str(e)}")

    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        """Withdraw funds from a deposit"""
        deposit = self.get_object()
        
        if deposit.withdrawn:
            return Response(
                {'error': 'Deposit already withdrawn'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if timezone.now() < deposit.unlocked_at:
            return Response(
                {'error': 'Deposit is still locked'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process withdrawal transaction on Solana
        try:
            # Create withdrawal transaction
            txn = Transaction()
            txn.add(transfer(
                TransferParams(
                    from_pubkey=PublicKey(deposit.pool.token_address),
                    to_pubkey=PublicKey(self.request.user.wallet_address),
                    lamports=int(deposit.amount * 10**9)  # Convert to lamports
                )
            ))
            
            # Send transaction (simulated for now)
            deposit.withdrawn = True
            deposit.withdraw_tx_hash = f"simulated_withdraw_tx_{deposit.id}"
            deposit.save()
            
            # Update pool liquidity
            pool = deposit.pool
            pool.available_liquidity += deposit.amount
            pool.save()
            
            return Response({
                'status': 'withdrawn',
                'tx_hash': deposit.withdraw_tx_hash,
                'amount': deposit.amount
            })
            
        except Exception as e:
            return Response(
                {'error': f'Withdrawal failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active deposits"""
        active_deposits = LenderDeposit.objects.filter(
            user=request.user,
            withdrawn=False
        )
        serializer = self.get_serializer(active_deposits, many=True)
        return Response(serializer.data)

class PoolAllocationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PoolAllocationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can see allocations from pools they've deposited to
        user_pool_ids = LenderDeposit.objects.filter(
            user=self.request.user
        ).values_list('pool_id', flat=True)
        
        return PoolAllocation.objects.filter(pool_id__in=user_pool_ids)

    @action(detail=False, methods=['get'])
    def by_loan(self, request, loan_id=None):
        """Get allocations for a specific loan"""
        allocations = PoolAllocation.objects.filter(loan_id=loan_id)
        serializer = self.get_serializer(allocations, many=True)
        return Response(serializer.data)