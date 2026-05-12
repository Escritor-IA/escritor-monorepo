from rest_framework import serializers
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    chapters_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            "id", "title", "genre", "synopsis", "status",
            "chapters_count", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_chapters_count(self, obj):
        return obj.chapters.count()

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
