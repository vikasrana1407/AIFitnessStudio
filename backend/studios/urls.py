from django.urls import path
from . import views

urlpatterns = [
    path("current", views.current_studio, name="current_studio"),
]
