import os
import requests
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.contrib.auth.models import User
from django.conf import settings
from .models import Profile
from .serializers_admin import AdminUserSerializer

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated]

    def check_admin_permission(self, request):
        if not hasattr(request, 'profile') or request.profile.role != 'admin':
            return False
        return True

    def list(self, request, *args, **kwargs):
        if not self.check_admin_permission(request):
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if not self.check_admin_permission(request):
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        email = data.get('new_email')
        password = data.get('password')
        
        if not email or not password:
            return Response({"error": "Email y contraseña son requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Crear usuario en Supabase Auth vía API REST (requests)
            # Usamos requests directamente para evitar conflictos con la librería supabase-py
            url = settings.SUPABASE_URL
            key = os.environ.get("SUPABASE_SERVICE_KEY")
            if not key:
                raise Exception("SUPABASE_SERVICE_KEY no está configurada")

            headers = {
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "email": email,
                "password": password,
                "email_confirm": True
            }
            
            # Endpoint: /auth/v1/admin/users
            api_url = f"{url}/auth/v1/admin/users"
            response = requests.post(api_url, json=payload, headers=headers)
            
            if response.status_code not in [200, 201]:
                raise Exception(f"Error Supabase API ({response.status_code}): {response.text}")
                
            user_data = response.json()
            # La respuesta puede ser el usuario directo o envuelto. 
            # GoTrue /admin/users devuelve el objeto usuario.
            supabase_id = user_data.get('id')
            if not supabase_id:
                 # Fallback por si la estructura cambia
                 supabase_id = user_data.get('user', {}).get('id')
            
            if not supabase_id:
                raise Exception(f"No se pudo obtener ID de usuario: {user_data}")

            # 2. Crear Profile y User en Django
            django_user, _ = User.objects.get_or_create(username=supabase_id, defaults={'email': email})
            django_user.set_unusable_password()
            django_user.save()

            profile, created = Profile.objects.get_or_create(id=supabase_id, defaults={'user': django_user})
            if not created:
                profile.user = django_user
            
            # Actualizar campos del perfil
            profile.nombre = data.get('nombre', '')
            profile.apellido = data.get('apellido', '')
            profile.rut = data.get('rut', '')
            profile.empresa = data.get('empresa', '')
            profile.role = data.get('role', 'usuario')
            profile.email = email
            profile.save()

            serializer = self.get_serializer(profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        if not self.check_admin_permission(request):
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """
        Soft Delete / Suspender usuario
        """
        if not self.check_admin_permission(request):
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        try:
            instance = self.get_object()
            user = instance.user
            
            # 1. Suspender en Django
            if user:
                user.is_active = False
                user.save()

            # 2. Banear en Supabase vía API REST
            url = settings.SUPABASE_URL
            key = os.environ.get("SUPABASE_SERVICE_KEY")
            if not key:
                raise Exception("SUPABASE_SERVICE_KEY no está configurada")

            headers = {
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            
            # Banear por 100 años
            payload = {"ban_duration": "876000h"}
            
            # Endpoint: /auth/v1/admin/users/{id}
            api_url = f"{url}/auth/v1/admin/users/{instance.id}"
            response = requests.put(api_url, json=payload, headers=headers)
            
            if response.status_code != 200:
                 # Si falla, verificar si es porque el usuario no existe en Auth (desincronización)
                 # pero por ahora lanzamos error
                 raise Exception(f"Error Supabase API ({response.status_code}): {response.text}")

            return Response({"message": "Usuario suspendido correctamente"}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
