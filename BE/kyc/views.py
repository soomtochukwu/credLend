from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import KYCDocument, KYCVerification
from .serializers import KYCDocumentSerializer, KYCVerificationSerializer

class KYCDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = KYCDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own documents
        return KYCDocument.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically set the user to the current user
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit KYC documents for verification"""
        document = self.get_object()
        
        if document.verified:
            return Response(
                {'error': 'Document already verified'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update KYC verification record
        verification, created = KYCVerification.objects.get_or_create(
            user=request.user,
            defaults={'status': 'pending'}
        )
        
        if not created:
            verification.status = 'pending'
            verification.save()
        
        return Response({
            'status': 'submitted',
            'verification_id': verification.id,
            'message': 'KYC documents submitted for verification'
        })

class KYCVerificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = KYCVerificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own verifications
        return KYCVerification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def status(self, request):
        """Get current KYC verification status"""
        verification = get_object_or_404(KYCVerification, user=request.user)
        serializer = self.get_serializer(verification)
        return Response(serializer.data)

# Admin views for KYC management
class KYCAdminViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing KYC verifications"""
    serializer_class = KYCVerificationSerializer
    permission_classes = [IsAdminUser]
    queryset = KYCVerification.objects.all()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve KYC verification"""
        verification = self.get_object()
        
        if verification.status == 'approved':
            return Response(
                {'error': 'KYC already approved'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        verification.status = 'approved'
        verification.verified_by = request.user
        verification.completed_at = timezone.now()
        verification.save()
        
        # Update user KYC status
        user = verification.user
        user.kyc_verified = True
        user.kyc_verified_at = timezone.now()
        user.save()
        
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject KYC verification"""
        verification = self.get_object()
        
        if verification.status == 'rejected':
            return Response(
                {'error': 'KYC already rejected'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rejection_reason = request.data.get('rejection_reason', '')
        
        verification.status = 'rejected'
        verification.verified_by = request.user
        verification.completed_at = timezone.now()
        verification.data['rejection_reason'] = rejection_reason
        verification.save()
        
        return Response({'status': 'rejected', 'reason': rejection_reason})

    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """Get documents for a specific verification"""
        verification = self.get_object()
        documents = KYCDocument.objects.filter(user=verification.user)
        serializer = KYCDocumentSerializer(documents, many=True)
        return Response(serializer.data)