from rest_framework import serializers
from .models import KYCDocument, KYCVerification

class KYCDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCDocument
        fields = [
            'id', 'document_type', 'document_number', 'front_image', 
            'back_image', 'selfie_image', 'verified', 'verified_at',
            'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'verified', 'verified_at', 'created_at', 'updated_at']

class KYCVerificationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    user_details = serializers.SerializerMethodField()

    class Meta:
        model = KYCVerification
        fields = [
            'id', 'user', 'user_details', 'status', 'status_display',
            'provider_reference', 'attested_hash', 'tx_hash',
            'completed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'provider_reference', 'attested_hash',
            'tx_hash', 'completed_at', 'created_at', 'updated_at'
        ]

    def get_user_details(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'wallet_address': obj.user.wallet_address
        }