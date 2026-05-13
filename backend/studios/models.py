import uuid
from django.db import models
from django.utils.text import slugify


class Studio(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    logo_url = models.URLField(blank=True, default="")
    brand_color = models.CharField(max_length=16, default="#264D3B")  # deep forest green
    voice_preference = models.CharField(max_length=64, default="warm_female")
    avatar_preference = models.CharField(max_length=64, default="instructor_neutral")
    tagline = models.CharField(max_length=200, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or "studio"
            slug = base
            i = 1
            while Studio.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                i += 1
                slug = f"{base}-{i}"
            self.slug = slug
        super().save(*args, **kwargs)
