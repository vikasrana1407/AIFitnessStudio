from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health(_request):
    return JsonResponse({"status": "ok", "service": "fitstudio-api"})


urlpatterns = [
    path("api/", health),
    path("api/health", health),
    path("api/auth/", include("accounts.urls")),
    path("api/studios/", include("studios.urls")),
    path("api/exercises/", include("exercises.urls")),
    path("api/classes/", include("classes.urls")),
    path("api/admin/", include("accounts.admin_urls")),
    path("django-admin/", admin.site.urls),
]
