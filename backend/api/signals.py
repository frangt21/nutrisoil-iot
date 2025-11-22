from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import Profile

# @receiver(post_save, sender=User)
# def create_or_update_user_profile(sender, instance, created, **kwargs):
#     """
#     NOTE: This signal is currently disabled.
#     The logic for creating/linking a profile is now handled directly within the
#     api.authentication.SupabaseAuthentication class to prevent deadlocks
#     and keep the logic centralized at the authentication entry point.
#     """
#     pass


