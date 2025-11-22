"""
Utilidades para autenticación con Supabase
( ! ) Por ahora se utiliza authentication.py, pero por si acaso no borrar este archivo
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import jwt
import requests
from typing import Optional, Dict, Any

# Cache para el JWKS (JSON Web Key Set) de Supabase
_jwks_cache = None


def get_supabase_jwks():
    """
    Obtiene las claves públicas de Supabase para verificar tokens JWT
    """
    global _jwks_cache
    if _jwks_cache is None:
        jwks_url = f"{settings.SUPABASE_URL}/.well-known/jwks.json"
        try:
            response = requests.get(jwks_url, timeout=5)
            response.raise_for_status()
            _jwks_cache = response.json()
        except Exception as e:
            print(f"Error al obtener JWKS de Supabase: {e}")
            _jwks_cache = {}
    return _jwks_cache


def get_signing_key(token: str):
    """
    Obtiene la clave de firma correspondiente al token JWT
    """
    jwks = get_supabase_jwks()
    unverified_header = jwt.get_unverified_header(token)
    
    if 'kid' not in unverified_header:
        return None
    
    for key in jwks.get('keys', []):
        if key.get('kid') == unverified_header['kid']:
            return jwt.algorithms.RSAAlgorithm.from_jwk(key)
    
    return None


def get_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifica un token JWT de Supabase y retorna la información del usuario
    """
    try:
        # Obtener la clave de firma
        signing_key = get_signing_key(token)
        if not signing_key:
            print("No se pudo obtener la clave de firma")
            return None
        
        # Decodificar y verificar el token
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience="authenticated",
            options={"verify_exp": True}
        )
        
        # Retornar un objeto similar al usuario de Supabase
        return {
            'id': payload.get('sub'),
            'email': payload.get('email'),
            'user_metadata': payload.get('user_metadata', {}),
            'app_metadata': payload.get('app_metadata', {}),
        }
    except jwt.ExpiredSignatureError:
        print("Token expirado")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Token inválido: {e}")
        return None
    except Exception as e:
        print(f"Error al verificar token: {e}")
        return None


def supabase_auth_required(view_func):
    """
    Decorador para proteger vistas que requieren autenticación de Supabase
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        # Obtener el token del header Authorization
        # DRF envuelve el request original en request._request
        auth_header = ''
        # Primero intenta con DRF request.headers
        if hasattr(request, 'headers'):
            auth_header = request.headers.get('Authorization', '')
        # Si no lo encuentra, busca en el request original (WSGI)
        if not auth_header and hasattr(request, '_request'):
            auth_header = request._request.META.get('HTTP_AUTHORIZATION', '')
        print(f"[AUTH] Header Authorization: {auth_header}")
        print(f"[AUTH] Header Authorization: {auth_header}")

        if not auth_header.startswith('Bearer '):
            print("[AUTH] No se proporcionó un token Bearer.")
            return Response(
                {'error': 'Token de autenticación no proporcionado'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        token = auth_header.split(' ')[1]
        print(f"[AUTH] Token recibido: {token}")
        user = get_user_from_token(token)

        if not user:
            print("[AUTH] Token inválido o expirado. Verificación fallida.")
            return Response(
                {'error': 'Token inválido o expirado'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        print(f"[AUTH] Usuario verificado: {user}")
        # Agregar el usuario al request (crear un objeto similar al de Supabase)
        class SupabaseUser:
            def __init__(self, user_data):
                self.id = user_data['id']
                self.email = user_data['email']
                self.user_metadata = user_data.get('user_metadata', {})
                self.app_metadata = user_data.get('app_metadata', {})

        request.supabase_user = SupabaseUser(user)
        request.supabase_token = token

        return view_func(request, *args, **kwargs)
    return _wrapped_view

