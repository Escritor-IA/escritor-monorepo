from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserPlan


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "is_staff")


@admin.register(UserPlan)
class UserPlanAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "credits", "billing_cycle", "expires_at")
    list_filter = ("plan", "billing_cycle")
    search_fields = ("user__email", "user__username")
