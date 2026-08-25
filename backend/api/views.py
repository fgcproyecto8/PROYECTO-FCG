from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Perfil
from .serializers import RegisterSerializer


@api_view(["GET"])
def hola(request):
    return Response({
        "mensaje": "Hola React!"
    })


@api_view(["POST"])
def register(request):

    serializer = RegisterSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    user = serializer.save()

    respuesta = {
        "mensaje": "Usuario registrado correctamente.",
        "usuario": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "rol": user.perfil.rol
        }
    }

    if user.perfil.rol == Perfil.Rol.DUENO_CANCHA:

        respuesta["mensaje"] = (
            "Cuenta creada. La solicitud como dueño "
            "de cancha está pendiente de aprobación."
        )

        respuesta["solicitud_dueno"] = {
            "estado": user.solicitud_dueno.estado
        }

    return Response(
        respuesta,
        status=status.HTTP_201_CREATED
    )
