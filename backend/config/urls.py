"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.views.static import serve as serve_media

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

# Imagenes subidas (fotos de perfil, fotos de cancha): se sirven desde
# este mismo proceso tanto en desarrollo como en producción, para que
# persistan y sean accesibles sin depender de que haya (o sepamos
# configurar) un proxy/CDN externo delante de este contenedor que
# sirva /media/ directo desde el volumen. django.conf.urls.static.static()
# no sirve para esto porque se desactiva solo si DEBUG=False, por eso
# se usa django.views.static.serve directamente. Documentado por
# Django como "grossly inefficient and probably insecure" a gran
# escala; para el tráfico esperado de este proyecto es una solución
# funcional y simple, no la más performante posible.
urlpatterns += [
    re_path(
        r'^media/(?P<path>.*)$',
        serve_media,
        {'document_root': settings.MEDIA_ROOT},
    ),
]