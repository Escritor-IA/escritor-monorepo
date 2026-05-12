from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Project
from apps.chapters.models import Chapter
from apps.ai_services.analysis_service import run_analysis

from .models import Analysis
from .serializers import AnalysisSerializer, RequestAnalysisSerializer


class AnalysisListView(generics.ListAPIView):
    serializer_class = AnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Analysis.objects.filter(project__user=self.request.user)
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        chapter_id = self.request.query_params.get("chapter")
        if chapter_id:
            qs = qs.filter(chapter_id=chapter_id)
        return qs


class AnalysisDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = AnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Analysis.objects.filter(project__user=self.request.user)


class RunAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RequestAnalysisSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            project = Project.objects.get(pk=data["project_id"], user=request.user)
        except Project.DoesNotExist:
            return Response({"detail": "Projeto não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        chapter = None
        if data.get("chapter_id"):
            try:
                chapter = Chapter.objects.get(pk=data["chapter_id"], project=project)
            except Chapter.DoesNotExist:
                return Response({"detail": "Capítulo não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        try:
            result = run_analysis(
                user=request.user,
                project=project,
                chapter=chapter,
                analysis_type=data["analysis_type"],
                creative_request=data.get("creative_request", ""),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except RuntimeError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(
            {
                "analysis": AnalysisSerializer(result["analysis"]).data,
                "credits_remaining": result["credits_remaining"],
            },
            status=status.HTTP_201_CREATED,
        )
