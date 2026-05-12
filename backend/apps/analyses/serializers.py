from rest_framework import serializers
from .models import Analysis


class AnalysisSerializer(serializers.ModelSerializer):
    analysis_type_display = serializers.CharField(source="get_analysis_type_display", read_only=True)
    chapter_title = serializers.SerializerMethodField()

    class Meta:
        model = Analysis
        fields = (
            "id", "project", "chapter", "chapter_title",
            "analysis_type", "analysis_type_display",
            "content", "credits_consumed", "ai_model", "created_at",
        )
        read_only_fields = fields

    def get_chapter_title(self, obj):
        if obj.chapter:
            return obj.chapter.title or f"Capítulo {obj.chapter.number}"
        return None


class RequestAnalysisSerializer(serializers.Serializer):
    project_id = serializers.IntegerField()
    chapter_id = serializers.IntegerField(required=False, allow_null=True)
    analysis_type = serializers.ChoiceField(choices=[
        "local", "local_context", "general", "total",
        "reader_simulation", "creative_suggestion",
    ])
    creative_request = serializers.CharField(required=False, allow_blank=True, default="")
