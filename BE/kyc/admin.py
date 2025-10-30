from django.contrib import admin
from .models import KYCDocument, KYCVerification


@admin.register(KYCDocument)
class KYCDocumentAdmin(admin.ModelAdmin):
    list_display = (
        "user", "document_type", "document_number",
        "verified", "verified_by", "verified_at", "created_at"
    )
    list_filter = ("document_type", "verified", "created_at")
    search_fields = ("document_number", "user__username", "user__email")

    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("User & Document Info", {
            "fields": ("user", "document_type", "document_number")
        }),
        ("Images", {
            "fields": ("front_image", "back_image", "selfie_image")
        }),
        ("Verification", {
            "fields": ("verified", "verified_by", "verified_at", "rejection_reason")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )


@admin.register(KYCVerification)
class KYCVerificationAdmin(admin.ModelAdmin):
    list_display = (
        "user", "status", "provider_reference",
        "attested_hash", "tx_hash", "completed_at", "created_at"
    )
    list_filter = ("status", "created_at")
    search_fields = ("user__username", "user__email", "provider_reference", "tx_hash")

    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("User & Status", {
            "fields": ("user", "status", "provider_reference")
        }),
        ("Verification Data", {
            "fields": ("data", "attested_hash", "tx_hash")
        }),
        ("Timestamps", {
            "fields": ("completed_at", "created_at", "updated_at")
        }),
    )
