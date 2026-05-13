from django.urls import path
from . import views

urlpatterns = [
    path("", views.exercise_list, name="exercise_list"),
    path("<uuid:pk>", views.exercise_detail, name="exercise_detail"),
    path("<uuid:pk>/approve", views.approve_exercise, name="approve_exercise"),
]
