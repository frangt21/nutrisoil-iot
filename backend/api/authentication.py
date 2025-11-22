# api/authentication.py
import jwt
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import Profile  # Importamos nuestro modelo Profile

class SupabaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        jwt_secret = settings.SUPABASE_JWT_SECRET
        if not jwt_secret:
            raise AuthenticationFailed("La clave secreta de JWT no está configurada.")

        try:
            payload = jwt.decode(
                token, jwt_secret, algorithms=["HS256"],
                audience="authenticated", options={"verify_exp": True}
            )
        except Exception as e:
            raise AuthenticationFailed(f"Token inválido: {e}")

        supabase_user_id = payload.get("sub")
        user_email = payload.get("email")

        if not supabase_user_id:
            raise AuthenticationFailed("El token no contiene un ID de usuario (sub).")

        # --- LÓGICA CLAVE ---
        try:
            # 1. Buscamos el Profile usando el ID de Supabase.
            #    Tu trigger se encarga de que este perfil exista.
            profile = Profile.objects.get(pk=supabase_user_id)
            
            # 2. Obtenemos el User de Django asociado a ese Profile.
            #    Si no existe (primera vez que el usuario se conecta a Django), lo creamos.
            if not profile.user:
                user, created = User.objects.get_or_create(
                    username=supabase_user_id, # Usamos el UUID como username para unicidad
                    defaults={'email': user_email, 'is_active': True}
                )
                if created:
                    user.set_unusable_password()
                    user.save()
                
                # Vinculamos el nuevo User al Profile
                profile.user = user
                profile.save()
            
            # 3. Adjuntamos el Profile al request para que las vistas lo usen.
            #    Esto es lo que solucionará tu error.
            request.profile = profile

            # 4. Devolvemos el User de Django, que es lo que DRF espera.
            return (profile.user, token)

        except Profile.DoesNotExist:
            # Este caso es un error grave: el trigger de Supabase no funcionó.
            raise AuthenticationFailed("El perfil del usuario no existe en la base de datos.")
        except Exception as e:
            raise AuthenticationFailed(f"Error al procesar el perfil de usuario: {e}")