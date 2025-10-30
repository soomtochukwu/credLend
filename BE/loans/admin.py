from django.contrib import admin
from .models import LoanProduct, LoanApplication, Loan, Repayment


@admin.register(LoanProduct)
class LoanProductAdmin(admin.ModelAdmin):
    list_display = (
        "name", "loan_type", "min_amount", "max_amount",
        "interest_rate", "collateral_required", "collateral_type",
        "ltv_ratio", "min_credit_score", "is_active"
    )
    list_filter = ("loan_type", "collateral_required", "is_active", "created_at")
    search_fields = ("name", "description")
    readonly_fields = ("created_at", "updated_at")


@admin.register(LoanApplication)
class LoanApplicationAdmin(admin.ModelAdmin):
    list_display = (
        "user", "loan_product", "amount", "duration_days",
        "status", "approved_by", "approved_at"
    )
    list_filter = ("status", "created_at", "updated_at")
    search_fields = ("user__username", "user__email", "purpose")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Application Info", {
            "fields": ("user", "loan_product", "amount", "duration_days", "purpose")
        }),
        ("Status & Approval", {
            "fields": ("status", "rejection_reason", "approved_by", "approved_at", "contract_address")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = (
        "application", "principal", "interest_rate", "total_due",
        "amount_repaid", "start_date", "due_date", "status"
    )
    list_filter = ("status", "start_date", "due_date")
    search_fields = ("application__user__username", "application__user__email")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Loan Info", {
            "fields": ("application", "principal", "interest_rate", "total_due", "amount_repaid")
        }),
        ("Timeline", {
            "fields": ("start_date", "due_date", "status")
        }),
        ("Collateral", {
            "fields": ("collateral_address", "collateral_value", "liquidated_at")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )


@admin.register(Repayment)
class RepaymentAdmin(admin.ModelAdmin):
    list_display = (
        "loan", "amount", "due_date", "paid_at", "tx_hash", "is_late"
    )
    list_filter = ("is_late", "due_date", "paid_at")
    search_fields = ("loan__application__user__username", "loan__application__user__email", "tx_hash")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Repayment Info", {
            "fields": ("loan", "amount", "due_date", "paid_at", "tx_hash", "is_late")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )
