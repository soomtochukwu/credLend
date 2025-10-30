from rest_framework import serializers
from .models import LenderPool, LenderDeposit, PoolAllocation

class LenderPoolSerializer(serializers.ModelSerializer):
    pool_type_display = serializers.CharField(source='get_pool_type_display', read_only=True)

    class Meta:
        model = LenderPool
        fields = [
            'id', 'name', 'pool_type', 'pool_type_display', 'description',
            'token_address', 'apy', 'total_liquidity', 'available_liquidity',
            'min_deposit', 'lock_period_days', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class LenderDepositSerializer(serializers.ModelSerializer):
    pool_details = serializers.SerializerMethodField()
    user_details = serializers.SerializerMethodField()

    class Meta:
        model = LenderDeposit
        fields = [
            'id', 'user', 'user_details', 'pool', 'pool_details', 'amount',
            'shares', 'deposit_tx_hash', 'unlocked_at', 'withdrawn',
            'withdraw_tx_hash', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'shares', 'deposit_tx_hash', 'unlocked_at',
            'withdrawn', 'withdraw_tx_hash', 'created_at', 'updated_at'
        ]

    def get_pool_details(self, obj):
        return {
            'id': obj.pool.id,
            'name': obj.pool.name,
            'apy': obj.pool.apy
        }

    def get_user_details(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'wallet_address': obj.user.wallet_address
        }

class PoolAllocationSerializer(serializers.ModelSerializer):
    pool_details = serializers.SerializerMethodField()
    loan_details = serializers.SerializerMethodField()

    class Meta:
        model = PoolAllocation
        fields = [
            'id', 'pool', 'pool_details', 'loan', 'loan_details', 'amount',
            'allocation_tx_hash', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_pool_details(self, obj):
        return {
            'id': obj.pool.id,
            'name': obj.pool.name
        }

    def get_loan_details(self, obj):
        return {
            'id': obj.loan.id,
            'principal': obj.loan.principal,
            'borrower_wallet': obj.loan.application.user.wallet_address
        }