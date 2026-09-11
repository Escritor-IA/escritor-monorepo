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


VALID_READER_PROFILES = ["luna", "rafael", "camila", "mateus", "vera", "heitor"]


class RequestAnalysisSerializer(serializers.Serializer):
    project_id = serializers.UUIDField()
    chapter_id = serializers.UUIDField(required=False, allow_null=True)
    analysis_type = serializers.ChoiceField(choices=[
        "local", "local_context", "general_context", "total",
        "reader_simulation", "creative_suggestion",
        "book_general", "book_total", "book_reader_simulation",
    ])
    reader_profiles = serializers.ListField(
        child=serializers.ChoiceField(choices=VALID_READER_PROFILES),
        required=False,
        default=list,
    )
    creative_request = serializers.CharField(required=False, allow_blank=True, default="")
    selected_text = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, data):
        analysis_type = data["analysis_type"]
        profiles = data.get("reader_profiles", [])

        if analysis_type in ("reader_simulation", "book_reader_simulation") and not profiles:
            raise serializers.ValidationError({"reader_profiles": "Selecione ao menos um perfil de leitor."})

        request = self.context.get("request")
        if request and hasattr(request.user, "user_plan"):
            self._validate_plan_restrictions(data, request.user.user_plan)

        return data

    def _validate_plan_restrictions(self, data, plan):
        analysis_type = data["analysis_type"]
        profiles = data.get("reader_profiles", [])

        if not plan.is_analysis_type_allowed(analysis_type):
            raise serializers.ValidationError({
                "analysis_type": "Este tipo de análise não está disponível no seu plano."
            })

        if analysis_type in ("reader_simulation", "book_reader_simulation"):
            allowed = plan.allowed_reader_profiles
            if allowed is not None:
                forbidden = [p for p in profiles if p not in allowed]
                if forbidden:
                    raise serializers.ValidationError({
                        "reader_profiles": (
                            f"Perfis não disponíveis no seu plano: {', '.join(forbidden)}."
                        )
                    })

            weekly_limit = plan.reader_simulation_weekly_limit
            if weekly_limit is not None:
                used = plan.count_reader_simulations_this_week()
                if used >= weekly_limit:
                    raise serializers.ValidationError({
                        "reader_profiles": (
                            f"Você atingiu o limite de {weekly_limit} simulações de leitores por semana."
                        )
                    })
