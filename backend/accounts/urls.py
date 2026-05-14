from django.urls import path
from . import views

urlpatterns = [
    path("register", views.register, name="register"),
    path("login", views.login, name="login"),
    path("me", views.me, name="me"),
    path("profile", views.me, name="profile"),  # alias for PATCH semantics
    path("password", views.change_password, name="change_password"),
]
