from rest_framework import serializers
from .models import Studio


class StudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Studio
        fields = [
            "id", "name", "slug", "logo_url", "brand_color",
            "voice_preference", "avatar_preference", "tagline",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]
