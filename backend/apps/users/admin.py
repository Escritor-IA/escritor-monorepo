from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "profile", "credits_balance", "plan", "is_staff")
    fieldsets = UserAdmin.fieldsets + (
        ("Escritor.AI", {"fields": ("profile", "credits_balance", "plan")}),
    )
