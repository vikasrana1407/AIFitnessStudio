import uuid
from django.db import models
from django.conf import settings


class FitnessClass(models.Model):
    STATUS_DRAFT = "DRAFT"
    STATUS_SCRIPTING = "SCRIPTING"
    STATUS_SCRIPT_READY = "SCRIPT_READY"
    STATUS_VOICING = "VOICING"
    STATUS_AVATAR_RENDERING = "AVATAR_RENDERING"
    STATUS_RENDERING = "RENDERING"
    STATUS_RENDERED = "RENDERED"
    STATUS_FAILED = "FAILED"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_SCRIPTING, "Scripting"),
        (STATUS_SCRIPT_READY, "Script Ready"),
        (STATUS_VOICING, "Generating Voice"),
        (STATUS_AVATAR_RENDERING, "Generating Avatar"),
        (STATUS_RENDERING, "Rendering Video"),
        (STATUS_RENDERED, "Rendered"),
        (STATUS_FAILED, "Failed"),
    ]
    FOCUS_CHOICES = [
        ("FULL_BODY", "Full Body"),
        ("CORE", "Core"),
        ("LOWER_BODY", "Lower Body"),
        ("UPPER_BODY", "Upper Body"),
        ("FLEXIBILITY", "Flexibility"),
        ("BALANCE", "Balance"),
        ("BACK_HEALTH", "Back Health"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    studio = models.ForeignKey(
        "studios.Studio", on_delete=models.CASCADE, related_name="fitness_classes",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="classes_created",
    )
    title = models.CharField(max_length=160)
    prompt = models.TextField()
    duration_minutes = models.PositiveIntegerField(default=30)
    focus_area = models.CharField(max_length=24, choices=FOCUS_CHOICES, default="FULL_BODY")
    difficulty = models.CharField(max_length=16, default="BEGINNER")
    music_style = models.CharField(max_length=60, default="Calm Ambient")
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    progress_percent = models.PositiveSmallIntegerField(default=0)
    script_json = models.JSONField(default=dict)  # {intro, segments:[...], outro}
    voice_url = models.URLField(blank=True, default="")
    avatar_url = models.URLField(blank=True, default="")
    video_url = models.URLField(blank=True, default="")
    error_message = models.TextField(blank=True, default="")
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class GenerationJob(models.Model):
    STEP_CHOICES = [
        ("SCRIPT", "Script Generation"),
        ("VOICE", "Voice Generation"),
        ("AVATAR", "Avatar Rendering"),
        ("RENDER", "Final Video Render"),
    ]
    STATUS_CHOICES = [
        ("QUEUED", "Queued"),
        ("RUNNING", "Running"),
        ("DONE", "Done"),
        ("FAILED", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fitness_class = models.ForeignKey(
        FitnessClass, on_delete=models.CASCADE, related_name="jobs",
    )
    step = models.CharField(max_length=16, choices=STEP_CHOICES)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="QUEUED")
    message = models.TextField(blank=True, default="")
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
