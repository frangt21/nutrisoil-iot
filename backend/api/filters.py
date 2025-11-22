import django_filters
from .models import Medicion

class MedicionFilter(django_filters.FilterSet):
    # Usamos '__date' para comparar solo la parte de la fecha del DateTimeField
    fecha__gte = django_filters.DateFilter(field_name='fecha', lookup_expr='date__gte')
    fecha__lte = django_filters.DateFilter(field_name='fecha', lookup_expr='date__lte')

    class Meta:
        model = Medicion
        fields = ['predio', 'fecha__gte', 'fecha__lte']
