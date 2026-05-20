from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "credits_balance", "plan", "is_staff")
    fieldsets = UserAdmin.fieldsets + (
        ("Escritor.AI", {"fields": ("credits_balance", "plan")}),
    )
