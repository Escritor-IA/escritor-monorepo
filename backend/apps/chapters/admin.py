from django.contrib import admin
from .models import Chapter


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ("number", "title", "project", "version", "updated_at")
    list_filter = ("project__genre",)
    search_fields = ("title", "project__title")
