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
from django.conf.urls.static import static
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
else:
    # En producción (DEBUG=False) static() no hace nada, y no hay otro
    # servidor que entregue estos archivos: el proxy de la universidad
    # solo reenvía api.app6.academia.ar a este contenedor. Los servimos
    # desde Django: los estilos del panel /admin/ (generados con
    # collectstatic) y las imágenes subidas (fotos de perfil y canchas).
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', serve,
                {'document_root': settings.STATIC_ROOT}),
        re_path(r'^media/(?P<path>.*)$', serve,
                {'document_root': settings.MEDIA_ROOT}),
    ]