from django.urls import path
from . import views

urlpatterns = [
    path("", views.class_list, name="class_list"),
    path("<uuid:pk>", views.class_detail, name="class_detail"),
    path("<uuid:pk>/regenerate-segment", views.regenerate_class_segment, name="regenerate_segment"),
    path("<uuid:pk>/regenerate", views.regenerate_full, name="regenerate_full"),
    path("<uuid:pk>/approve", views.approve_class, name="approve_class"),
]
