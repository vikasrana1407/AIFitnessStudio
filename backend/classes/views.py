from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import FitnessClass, GenerationJob
from .serializers import (
    FitnessClassListSerializer,
    FitnessClassDetailSerializer,
    FitnessClassCreateSerializer,
)
from .pipeline import kickoff_pipeline, regenerate_segment


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def class_list(request):
    user = request.user
    if not user.studio_id:
        return Response([])  # super admin has no studio → empty list

    if request.method == "GET":
        qs = FitnessClass.objects.filter(studio=user.studio)
        status_filter = request.GET.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(FitnessClassListSerializer(qs, many=True).data)

    serializer = FitnessClassCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    fc = FitnessClass.objects.create(
        studio=user.studio,
        created_by=user,
        **serializer.validated_data,
    )
    kickoff_pipeline(fc.id)
    return Response(FitnessClassDetailSerializer(fc).data, status=201)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def class_detail(request, pk):
    user = request.user
    try:
        fc = FitnessClass.objects.get(pk=pk)
    except FitnessClass.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)
    if fc.studio_id != user.studio_id and user.role != "SUPER_ADMIN":
        return Response({"detail": "Forbidden"}, status=403)

    if request.method == "GET":
        return Response(FitnessClassDetailSerializer(fc).data)

    if request.method == "DELETE":
        fc.delete()
        return Response(status=204)

    # PATCH — allow editing script_json segments + metadata
    allowed = {"title", "music_style", "is_approved", "script_json"}
    payload = {k: v for k, v in request.data.items() if k in allowed}
    for k, v in payload.items():
        setattr(fc, k, v)
    fc.save()
    return Response(FitnessClassDetailSerializer(fc).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def regenerate_class_segment(request, pk):
    user = request.user
    try:
        fc = FitnessClass.objects.get(pk=pk)
    except FitnessClass.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)
    if fc.studio_id != user.studio_id and user.role != "SUPER_ADMIN":
        return Response({"detail": "Forbidden"}, status=403)
    try:
        idx = int(request.data.get("segment_index", -1))
    except (TypeError, ValueError):
        return Response({"detail": "segment_index required"}, status=400)
    instruction = request.data.get("instruction", "")
    try:
        fc = regenerate_segment(fc.id, idx, instruction)
    except ValueError as e:
        return Response({"detail": str(e)}, status=400)
    return Response(FitnessClassDetailSerializer(fc).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def regenerate_full(request, pk):
    """Re-run the entire pipeline for a class."""
    user = request.user
    try:
        fc = FitnessClass.objects.get(pk=pk)
    except FitnessClass.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)
    if fc.studio_id != user.studio_id and user.role != "SUPER_ADMIN":
        return Response({"detail": "Forbidden"}, status=403)
    fc.status = FitnessClass.STATUS_DRAFT
    fc.progress_percent = 0
    fc.error_message = ""
    fc.is_approved = False
    fc.save()
    kickoff_pipeline(fc.id)
    return Response(FitnessClassDetailSerializer(fc).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_class(request, pk):
    user = request.user
    try:
        fc = FitnessClass.objects.get(pk=pk)
    except FitnessClass.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)
    if fc.studio_id != user.studio_id and user.role != "SUPER_ADMIN":
        return Response({"detail": "Forbidden"}, status=403)
    fc.is_approved = True
    fc.save(update_fields=["is_approved", "updated_at"])
    return Response(FitnessClassDetailSerializer(fc).data)
