import uuid
from django.db import models


class Exercise(models.Model):
    DIFFICULTY_CHOICES = [
        ("BEGINNER", "Beginner"),
        ("INTERMEDIATE", "Intermediate"),
        ("ADVANCED", "Advanced"),
    ]
    CATEGORY_CHOICES = [
        ("MAT_PILATES", "Mat Pilates"),
        ("REFORMER", "Reformer"),
        ("CORE", "Core"),
        ("FLEXIBILITY", "Flexibility"),
        ("BALANCE", "Balance"),
        ("STRENGTH", "Strength"),
        ("CARDIO", "Cardio"),
        ("WARMUP", "Warm-up"),
        ("COOLDOWN", "Cool-down"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Null studio = system/master exercise available to all
    studio = models.ForeignKey(
        "studios.Studio", on_delete=models.CASCADE,
        null=True, blank=True, related_name="exercises",
    )
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=24, choices=CATEGORY_CHOICES)
    difficulty = models.CharField(max_length=16, choices=DIFFICULTY_CHOICES, default="BEGINNER")
    muscle_groups = models.JSONField(default=list)
    instructions = models.TextField()
    safety_notes = models.TextField(blank=True, default="")
    demo_video_url = models.URLField(blank=True, default="")
    demo_thumbnail_url = models.URLField(blank=True, default="")
    duration_seconds = models.PositiveIntegerField(default=45)
    is_approved = models.BooleanField(default=True)
    alternatives = models.ManyToManyField("self", blank=True, symmetrical=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "name"]

    def __str__(self):
        return self.name
