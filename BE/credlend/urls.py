"""
URL configuration for credlend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from kyc.views import KYCDocumentViewSet, KYCVerificationViewSet, KYCAdminViewSet
from lenders.views import LenderPoolViewSet, LenderDepositViewSet, PoolAllocationViewSet

router = DefaultRouter()
router.register(r'kyc/documents', KYCDocumentViewSet, basename='kycdocument')
router.register(r'kyc/verifications', KYCVerificationViewSet, basename='kycverification')
router.register(r'admin/kyc', KYCAdminViewSet, basename='kycadmin')
router.register(r'lender-pools', LenderPoolViewSet, basename='lenderpool')
router.register(r'lender-deposits', LenderDepositViewSet, basename='lenderdeposit')
router.register(r'pool-allocations', PoolAllocationViewSet, basename='poolallocation')

urlpatterns = [
    # path('admin/', include('admin_honeypot.urls', namespace='admin_honeypot')),
    path('cred-lend-admin/', admin.site.urls),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include(router.urls)),
]
