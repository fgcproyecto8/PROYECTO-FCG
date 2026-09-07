# Generated manually (equivalente al resultado de `makemigrations api`)
# porque el entorno de esta sesion no permitio ejecutar ese comando.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0009_partido_participacionpartido_invitacionpartido'),
    ]

    operations = [
        migrations.CreateModel(
            name='Notificacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(choices=[('solicitud_amistad_recibida', 'Solicitud de amistad recibida'), ('solicitud_amistad_aceptada', 'Solicitud de amistad aceptada'), ('solicitud_amistad_rechazada', 'Solicitud de amistad rechazada'), ('invitacion_partido', 'Invitación a un partido'), ('partido_proximo', 'Partido próximo a comenzar'), ('invitacion_aceptada', 'Invitación a partido aceptada'), ('invitacion_rechazada', 'Invitación a partido rechazada')], max_length=30)),
                ('mensaje', models.CharField(max_length=255)),
                ('leida', models.BooleanField(default=False)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notificaciones_generadas', to=settings.AUTH_USER_MODEL)),
                ('destinatario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notificaciones', to=settings.AUTH_USER_MODEL)),
                ('partido', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notificaciones', to='api.partido')),
                ('solicitud_amistad', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notificaciones', to='api.solicitudamistad')),
                ('invitacion_partido', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notificaciones', to='api.invitacionpartido')),
            ],
            options={
                'ordering': ['-fecha_creacion'],
                'constraints': [
                    models.UniqueConstraint(condition=models.Q(('tipo', 'partido_proximo')), fields=('destinatario', 'partido'), name='notificacion_partido_proximo_unica'),
                ],
            },
        ),
    ]
