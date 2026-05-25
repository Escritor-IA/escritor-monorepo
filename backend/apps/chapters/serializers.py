from rest_framework import serializers
from apps.projects.models import Project
from .models import Chapter
from .utils import extract_text_from_file


def _check_word_limit(content: str, user) -> None:
    """Raises ValidationError if content exceeds the user's plan word limit."""
    if not hasattr(user, "user_plan"):
        return
    limit = user.user_plan.chapter_word_limit
    if limit is None:
        return
    word_count = len(content.split())
    if word_count > limit:
        raise serializers.ValidationError(
            f"O capítulo possui {word_count:,} palavras, mas o seu plano permite no máximo {limit:,} por capítulo."
        )


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ("id", "project", "number", "title", "content", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_content(self, value):
        request = self.context.get("request")
        if request:
            _check_word_limit(value, request.user)
        return value

    def validate(self, attrs):
        project = attrs.get("project") or (self.instance.project if self.instance else None)
        number = attrs.get("number") or (self.instance.number if self.instance else None)
        if project and number:
            qs = Chapter.objects.filter(project=project, number=number)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"number": "Já existe um capítulo com este número neste projeto."})
        return attrs


class ChapterImportSerializer(serializers.Serializer):
    project_id = serializers.UUIDField()
    file = serializers.FileField()
    chapter_title = serializers.CharField(max_length=200, required=False, default="")

    def validate_project_id(self, value):
        request = self.context["request"]
        try:
            return Project.objects.get(pk=value, user=request.user)
        except Project.DoesNotExist:
            raise serializers.ValidationError("Projeto não encontrado.")

    def save(self, **kwargs):
        project = self.validated_data["project_id"]
        uploaded_file = self.validated_data["file"]
        title = self.validated_data.get("chapter_title", "")

        text = extract_text_from_file(uploaded_file)

        request = self.context.get("request")
        if request:
            _check_word_limit(text, request.user)

        next_number = (project.chapters.order_by("-number").first().number + 1
                       if project.chapters.exists() else 1)

        return Chapter.objects.create(
            project=project,
            number=next_number,
            title=title or uploaded_file.name,
            content=text,
        )
