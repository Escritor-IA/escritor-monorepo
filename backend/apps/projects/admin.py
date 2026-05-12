from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "genre", "status", "created_at")
    list_filter = ("genre", "status")
    search_fields = ("title", "user__username")
