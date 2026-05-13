from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from studios.models import Studio
from studios.serializers import StudioSerializer
from classes.models import FitnessClass
from django.contrib.auth import get_user_model

User = get_user_model()


def tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(
        {"user": UserSerializer(user).data, **tokens_for(user)},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"].lower()
    password = serializer.validated_data["password"]
    user = authenticate(request, username=email, password=password)
    if user is None:
        # try case-insensitive lookup
        try:
            u = User.objects.get(email__iexact=email)
            user = authenticate(request, username=u.username, password=password)
        except User.DoesNotExist:
            user = None
    if user is None:
        return Response({"detail": "Invalid credentials"}, status=401)
    return Response({"user": UserSerializer(user).data, **tokens_for(user)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


# Super-admin endpoints
def _require_super_admin(user):
    return user.is_authenticated and user.role == User.ROLE_SUPER_ADMIN


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_studios(request):
    if not _require_super_admin(request.user):
        return Response({"detail": "Forbidden"}, status=403)
    studios = Studio.objects.all()
    data = StudioSerializer(studios, many=True).data
    for s in data:
        s["member_count"] = User.objects.filter(studio_id=s["id"]).count()
        s["class_count"] = FitnessClass.objects.filter(studio_id=s["id"]).count()
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_users(request):
    if not _require_super_admin(request.user):
        return Response({"detail": "Forbidden"}, status=403)
    users = User.objects.all().select_related("studio")
    return Response(UserSerializer(users, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_metrics(request):
    if not _require_super_admin(request.user):
        return Response({"detail": "Forbidden"}, status=403)
    return Response({
        "total_studios": Studio.objects.count(),
        "total_users": User.objects.count(),
        "total_classes": FitnessClass.objects.count(),
        "classes_rendered": FitnessClass.objects.filter(status="RENDERED").count(),
        "classes_in_progress": FitnessClass.objects.exclude(
            status__in=["RENDERED", "FAILED", "DRAFT"]
        ).count(),
    })
