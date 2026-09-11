from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/projects/", include("apps.projects.urls")),
    path("api/", include("apps.chapters.urls")),
    path("api/analyses/", include("apps.analyses.urls")),
    path("api/payments/", include("apps.payments.urls")),
]
