import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_OWNER = "OWNER"
    ROLE_TRAINER = "TRAINER"
    ROLE_SUPER_ADMIN = "SUPER_ADMIN"
    ROLE_CHOICES = [
        (ROLE_OWNER, "Studio Owner"),
        (ROLE_TRAINER, "Trainer"),
        (ROLE_SUPER_ADMIN, "Super Admin"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=24, choices=ROLE_CHOICES, default=ROLE_OWNER)
    studio = models.ForeignKey(
        "studios.Studio",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="members",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email
