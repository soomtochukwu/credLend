from rest_framework import serializers
from .models import LoanProduct, LoanApplication, Loan, Repayment
from core.models import User

class LoanProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanProduct
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class LoanApplicationSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_details = serializers.SerializerMethodField()
    loan_product_details = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = LoanApplication
        fields = [
            'id', 'user', 'user_details', 'loan_product', 'loan_product_details',
            'amount', 'duration_days', 'purpose', 'status', 'status_display',
            'rejection_reason', 'approved_by', 'approved_at', 'contract_address',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'rejection_reason', 'approved_by', 
            'approved_at', 'contract_address', 'created_at', 'updated_at'
        ]

    def get_user_details(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'wallet_address': obj.user.wallet_address
        }

    def get_loan_product_details(self, obj):
        return {
            'id': obj.loan_product.id,
            'name': obj.loan_product.name,
            'loan_type': obj.loan_product.loan_type,
            'interest_rate': obj.loan_product.interest_rate
        }

    def create(self, validated_data):
        # Set the user from the request
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def validate(self, data):
        # Validate loan amount against product limits
        loan_product = data.get('loan_product')
        amount = data.get('amount')
        
        if loan_product and amount:
            if amount < loan_product.min_amount:
                raise serializers.ValidationError(
                    f"Amount must be at least {loan_product.min_amount}"
                )
            if amount > loan_product.max_amount:
                raise serializers.ValidationError(
                    f"Amount cannot exceed {loan_product.max_amount}"
                )
        
        # Validate duration against product limits
        duration_days = data.get('duration_days')
        if loan_product and duration_days:
            if duration_days < loan_product.min_duration:
                raise serializers.ValidationError(
                    f"Duration must be at least {loan_product.min_duration} days"
                )
            if duration_days > loan_product.max_duration:
                raise serializers.ValidationError(
                    f"Duration cannot exceed {loan_product.max_duration} days"
                )
        
        return data

class LoanSerializer(serializers.ModelSerializer):
    application_details = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    remaining_amount = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = [
            'id', 'application', 'application_details', 'principal', 'interest_rate',
            'total_due', 'amount_repaid', 'remaining_amount', 'progress_percentage',
            'start_date', 'due_date', 'status', 'status_display', 'collateral_address',
            'collateral_value', 'liquidated_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'principal', 'interest_rate', 'total_due', 'amount_repaid',
            'start_date', 'due_date', 'status', 'liquidated_at', 'created_at', 'updated_at'
        ]

    def get_application_details(self, obj):
        return {
            'id': obj.application.id,
            'user_id': obj.application.user.id,
            'user_wallet': obj.application.user.wallet_address,
            'purpose': obj.application.purpose
        }

    def get_remaining_amount(self, obj):
        return obj.total_due - obj.amount_repaid

    def get_progress_percentage(self, obj):
        if obj.total_due > 0:
            return (obj.amount_repaid / obj.total_due) * 100
        return 0

class RepaymentSerializer(serializers.ModelSerializer):
    loan_details = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Repayment
        fields = [
            'id', 'loan', 'loan_details', 'amount', 'due_date', 'paid_at',
            'tx_hash', 'is_late', 'is_overdue', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'is_late', 'created_at', 'updated_at'
        ]

    def get_loan_details(self, obj):
        return {
            'id': obj.loan.id,
            'principal': obj.loan.principal,
            'total_due': obj.loan.total_due
        }

    def get_status(self, obj):
        if obj.paid_at:
            return 'paid'
        elif obj.is_late:
            return 'overdue'
        else:
            return 'pending'

    def get_is_overdue(self, obj):
        from django.utils import timezone
        return not obj.paid_at and obj.due_date < timezone.now()

    def validate(self, data):
        # Ensure repayment amount doesn't exceed remaining loan amount
        loan = data.get('loan')
        amount = data.get('amount')
        
        if loan and amount:
            remaining_amount = loan.total_due - loan.amount_repaid
            if amount > remaining_amount:
                raise serializers.ValidationError(
                    f"Repayment amount cannot exceed remaining loan amount of {remaining_amount}"
                )
        
        return data