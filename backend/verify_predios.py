import os
import django
from django.conf import settings

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nutrisoil_project.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Predio, Profile
from rest_framework.test import APIClient
from rest_framework import status

def verify_predios_crud():
    print("Starting Predios CRUD Verification...")

    # Setup: Create a test user and profile
    username = "testuser_predios"
    email = "testuser_predios@example.com"
    password = "testpassword123"
    
    user, created = User.objects.get_or_create(username=username, email=email)
    user.set_password(password)
    user.save()
    
    # Ensure profile exists (signal might have created it, but let's be safe)
    profile, _ = Profile.objects.get_or_create(user=user, defaults={
        'nombre': 'Test', 'apellido': 'User', 'rut': '12345678-9'
    })

    client = APIClient()
    client.force_authenticate(user=user)
    
    # 1. Create Predio
    print("\n1. Testing Create Predio...")
    predio_data = {
        "nombre": "Predio Test 1",
        "superficie": 10.5,
        "zona": "Norte",
        "tipo_suelo": "Arcilloso",
        "cultivo_actual": "Maiz"
    }
    response = client.post('/api/predios/', predio_data, format='json')
    if response.status_code == status.HTTP_201_CREATED:
        print("✅ Create Success")
        predio_id = response.data['id']
    else:
        print(f"❌ Create Failed: {response.status_code} - {response.data}")
        return

    # 2. List Predios
    print("\n2. Testing List Predios...")
    response = client.get('/api/predios/')
    if response.status_code == status.HTTP_200_OK:
        if len(response.data) > 0 and response.data[0]['id'] == predio_id:
             print("✅ List Success")
        else:
             print(f"❌ List Failed: Data mismatch - {response.data}")
    else:
        print(f"❌ List Failed: {response.status_code}")

    # 3. Update Predio
    print("\n3. Testing Update Predio...")
    update_data = {"nombre": "Predio Test 1 Updated"}
    response = client.patch(f'/api/predios/{predio_id}/', update_data, format='json')
    if response.status_code == status.HTTP_200_OK:
        if response.data['nombre'] == "Predio Test 1 Updated":
            print("✅ Update Success")
        else:
            print(f"❌ Update Failed: Name not updated - {response.data}")
    else:
        print(f"❌ Update Failed: {response.status_code} - {response.data}")

    # 4. Delete Predio
    print("\n4. Testing Delete Predio...")
    response = client.delete(f'/api/predios/{predio_id}/')
    if response.status_code == status.HTTP_204_NO_CONTENT:
        print("✅ Delete Success")
    else:
        print(f"❌ Delete Failed: {response.status_code}")

    # 5. Verify Deletion
    print("\n5. Verifying Deletion...")
    response = client.get(f'/api/predios/{predio_id}/')
    if response.status_code == status.HTTP_404_NOT_FOUND:
        print("✅ Deletion Verified")
    else:
        print(f"❌ Deletion Verification Failed: {response.status_code}")

    # Cleanup
    print("\nCleaning up...")
    user.delete() # Cascade deletes profile and predios if any remained
    print("Done.")

if __name__ == "__main__":
    verify_predios_crud()
