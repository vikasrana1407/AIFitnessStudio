from django.urls import path
from . import views

urlpatterns = [
    path("studios", views.admin_studios, name="admin_studios"),
    path("users", views.admin_users, name="admin_users"),
    path("metrics", views.admin_metrics, name="admin_metrics"),
]
