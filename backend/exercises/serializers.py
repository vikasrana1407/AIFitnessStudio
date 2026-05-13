from rest_framework import serializers
from .models import Exercise


class ExerciseSerializer(serializers.ModelSerializer):
    is_system = serializers.SerializerMethodField()

    class Meta:
        model = Exercise
        fields = [
            "id", "studio", "name", "category", "difficulty",
            "muscle_groups", "instructions", "safety_notes",
            "demo_video_url", "demo_thumbnail_url", "duration_seconds",
            "is_approved", "is_system", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "studio", "is_system", "created_at", "updated_at"]

    def get_is_system(self, obj):
        return obj.studio_id is None
