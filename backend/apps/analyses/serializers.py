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
            "reader_profiles", "content", "credits_consumed", "ai_model", "created_at",
        )
        read_only_fields = fields

    def get_chapter_title(self, obj):
        if obj.chapter:
            return obj.chapter.title or f"Capítulo {obj.chapter.number}"
        return None


VALID_READER_PROFILES = ["luna", "rafael", "camila", "mateus", "vera"]


class RequestAnalysisSerializer(serializers.Serializer):
    project_id = serializers.UUIDField()
    chapter_id = serializers.UUIDField(required=False, allow_null=True)
    analysis_type = serializers.ChoiceField(choices=[
        "local", "local_context", "general_context", "total",
        "reader_simulation", "creative_suggestion",
    ])
    reader_profiles = serializers.ListField(
        child=serializers.ChoiceField(choices=VALID_READER_PROFILES),
        required=False,
        default=list,
    )
    creative_request = serializers.CharField(required=False, allow_blank=True, default="")
    selected_text = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, data):
        if data["analysis_type"] == "reader_simulation" and not data.get("reader_profiles"):
            raise serializers.ValidationError({"reader_profiles": "Selecione ao menos um perfil de leitor."})
        return data
