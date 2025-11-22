from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile

class AdminUserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    
    # Campos para creación (write_only)
    new_email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, style={'input_type': 'password'})

    class Meta:
        model = Profile
        fields = [
            'id', 
            'email', 
            'new_email', 
            'password', 
            'nombre', 
            'apellido', 
            'rut', 
            'empresa', 
            'role', 
            'is_active'
        ]

        read_only_fields = ['id', 'email', 'is_active']
        extra_kwargs = {
            'rut': {'required': False, 'allow_blank': True, 'allow_null': True},
            'empresa': {'required': False, 'allow_blank': True, 'allow_null': True},
            'nombre': {'required': False, 'allow_blank': True, 'allow_null': True},
            'apellido': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def validate(self, data):
        # Validaciones extra si son necesarias
        return data
