from rest_framework import serializers
from .models import FitnessClass, GenerationJob


class GenerationJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = GenerationJob
        fields = [
            "id", "step", "status", "message",
            "started_at", "completed_at", "created_at",
        ]


class FitnessClassListSerializer(serializers.ModelSerializer):
    class Meta:
        model = FitnessClass
        fields = [
            "id", "title", "prompt", "duration_minutes", "focus_area",
            "difficulty", "music_style", "status", "progress_percent",
            "is_approved", "video_url", "created_at", "updated_at",
        ]


class FitnessClassDetailSerializer(serializers.ModelSerializer):
    jobs = GenerationJobSerializer(many=True, read_only=True)

    class Meta:
        model = FitnessClass
        fields = [
            "id", "studio", "title", "prompt", "duration_minutes",
            "focus_area", "difficulty", "music_style", "status",
            "progress_percent", "script_json", "voice_url", "avatar_url",
            "video_url", "error_message", "is_approved",
            "jobs", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "studio", "status", "progress_percent", "script_json",
            "voice_url", "avatar_url", "video_url", "error_message", "jobs",
            "created_at", "updated_at",
        ]


class FitnessClassCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FitnessClass
        fields = [
            "title", "prompt", "duration_minutes",
            "focus_area", "difficulty", "music_style",
        ]
