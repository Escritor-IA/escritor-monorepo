from django.contrib import admin
from .models import Analysis, ContextVector


@admin.register(Analysis)
class AnalysisAdmin(admin.ModelAdmin):
    list_display = ("analysis_type", "project", "chapter", "credits_consumed", "ai_model", "created_at")
    list_filter = ("analysis_type", "ai_model")
    search_fields = ("project__title",)


@admin.register(ContextVector)
class ContextVectorAdmin(admin.ModelAdmin):
    list_display = ("chapter", "project", "indexed_at")
    search_fields = ("chapter__title", "project__title")
