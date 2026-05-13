from rest_framework import serializers
from django.contrib.auth import get_user_model
from studios.models import Studio
from studios.serializers import StudioSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    studio = StudioSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "username", "first_name", "last_name", "role", "studio"]
        read_only_fields = ["id", "role", "studio"]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    full_name = serializers.CharField(max_length=120)
    studio_name = serializers.CharField(max_length=120)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value.lower()

    def create(self, validated_data):
        studio = Studio.objects.create(name=validated_data["studio_name"])
        name = validated_data["full_name"].strip()
        first, _, last = name.partition(" ")
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=first,
            last_name=last,
            role=User.ROLE_OWNER,
        )
        user.studio = studio
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
