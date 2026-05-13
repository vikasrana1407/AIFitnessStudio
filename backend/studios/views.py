from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Studio
from .serializers import StudioSerializer


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def current_studio(request):
    """Get or update the studio of the authenticated user."""
    user = request.user
    if not user.studio_id:
        return Response({"detail": "User has no studio"}, status=400)
    studio = user.studio
    if request.method == "GET":
        return Response(StudioSerializer(studio).data)

    # PATCH — only OWNER or SUPER_ADMIN can edit
    if user.role not in ("OWNER", "SUPER_ADMIN"):
        return Response({"detail": "Permission denied"}, status=403)
    serializer = StudioSerializer(studio, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
