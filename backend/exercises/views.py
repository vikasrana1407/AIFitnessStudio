from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Exercise
from .serializers import ExerciseSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def exercise_list(request):
    user = request.user
    if request.method == "GET":
        qs = Exercise.objects.filter(Q(studio__isnull=True) | Q(studio=user.studio))
        category = request.GET.get("category")
        difficulty = request.GET.get("difficulty")
        search = request.GET.get("q")
        scope = request.GET.get("scope")  # "system" | "studio" | None
        if category:
            qs = qs.filter(category=category)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        if search:
            qs = qs.filter(name__icontains=search)
        if scope == "system":
            qs = qs.filter(studio__isnull=True)
        elif scope == "studio":
            qs = qs.filter(studio=user.studio)
        return Response(ExerciseSerializer(qs, many=True).data)

    # POST
    # Permission: SUPER_ADMIN may create system OR studio-scoped exercises
    # (controlled by `?scope=system` query param). Owners may only create
    # studio-scoped exercises. Trainers/anonymous: forbidden.
    if user.role not in ("OWNER", "SUPER_ADMIN"):
        return Response({"detail": "Permission denied"}, status=403)
    serializer = ExerciseSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    target_scope = request.GET.get("scope") or request.data.get("scope")
    if user.role == "SUPER_ADMIN" and target_scope == "system":
        studio = None
    elif user.role == "SUPER_ADMIN" and not user.studio_id:
        # super admins without a studio default to creating system exercises
        studio = None
    else:
        studio = user.studio
    obj = serializer.save(studio=studio, is_approved=True)
    return Response(ExerciseSerializer(obj).data, status=201)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def exercise_detail(request, pk):
    user = request.user
    try:
        ex = Exercise.objects.get(pk=pk)
    except Exercise.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)
    # access: system OR own studio
    if ex.studio_id and ex.studio_id != user.studio_id and user.role != "SUPER_ADMIN":
        return Response({"detail": "Forbidden"}, status=403)

    if request.method == "GET":
        return Response(ExerciseSerializer(ex).data)

    # write — system exercises only editable by SUPER_ADMIN
    if ex.studio_id is None and user.role != "SUPER_ADMIN":
        return Response({"detail": "Cannot modify system exercise"}, status=403)

    if request.method == "DELETE":
        ex.delete()
        return Response(status=204)

    serializer = ExerciseSerializer(ex, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_exercise(request, pk):
    user = request.user
    if user.role not in ("OWNER", "SUPER_ADMIN"):
        return Response({"detail": "Forbidden"}, status=403)
    try:
        ex = Exercise.objects.get(pk=pk)
    except Exercise.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)
    ex.is_approved = True
    ex.save(update_fields=["is_approved"])
    return Response(ExerciseSerializer(ex).data)
