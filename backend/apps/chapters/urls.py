from django.urls import path
from .views import ChapterListCreateView, ChapterDetailView, ChapterImportView

urlpatterns = [
    path("projects/<int:project_pk>/chapters/", ChapterListCreateView.as_view(), name="chapter-list"),
    path("chapters/<int:pk>/", ChapterDetailView.as_view(), name="chapter-detail"),
    path("chapters/import/", ChapterImportView.as_view(), name="chapter-import"),
]
