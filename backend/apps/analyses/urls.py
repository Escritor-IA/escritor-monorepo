from django.urls import path
from .views import AnalysisListView, AnalysisDetailView, RunAnalysisView

urlpatterns = [
    path("", AnalysisListView.as_view(), name="analysis-list"),
    path("<int:pk>/", AnalysisDetailView.as_view(), name="analysis-detail"),
    path("run/", RunAnalysisView.as_view(), name="analysis-run"),
]
