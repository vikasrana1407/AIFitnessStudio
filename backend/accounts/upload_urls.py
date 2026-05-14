from django.urls import path
from . import upload_views

urlpatterns = [
    path("profile-picture", upload_views.upload_profile_picture, name="upload_profile_picture"),
    path("studio-logo", upload_views.upload_studio_logo, name="upload_studio_logo"),
]
