from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Project
from .models import Chapter
from .serializers import ChapterSerializer, ChapterImportSerializer


class ChapterListCreateView(generics.ListCreateAPIView):
    serializer_class = ChapterSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Chapter.objects.filter(
            project__user=self.request.user,
            project_id=self.kwargs["project_pk"],
        )

    def perform_create(self, serializer):
        project = generics.get_object_or_404(
            Project, pk=self.kwargs["project_pk"], user=self.request.user
        )
        serializer.save(project=project)


class ChapterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ChapterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Chapter.objects.filter(project__user=self.request.user)


class ChapterImportView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes_required = ["multipart/form-data"]

    def post(self, request):
        serializer = ChapterImportSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        chapter = serializer.save()
        return Response(ChapterSerializer(chapter).data, status=status.HTTP_201_CREATED)
