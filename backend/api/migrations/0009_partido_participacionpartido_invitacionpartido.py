# Generated manually (equivalente al resultado de `makemigrations api`)
# porque el entorno de esta sesion no permitio ejecutar ese comando.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0008_cancha'),
    ]

    operations = [
        migrations.CreateModel(
            name='Partido',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=150)),
                ('descripcion', models.TextField(blank=True)),
                ('fecha', models.DateField()),
                ('hora', models.TimeField()),
                ('cupo', models.PositiveSmallIntegerField()),
                ('es_publico', models.BooleanField(default=True)),
                ('password', models.CharField(blank=True, max_length=128)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('cancha', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='partidos', to='api.cancha')),
                ('creador', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='partidos_creados', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-fecha_creacion'],
                'constraints': [
                    models.UniqueConstraint(fields=('cancha', 'fecha', 'hora'), name='partido_cancha_fecha_hora_unico'),
                ],
            },
        ),
        migrations.CreateModel(
            name='ParticipacionPartido',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha_union', models.DateTimeField(auto_now_add=True)),
                ('partido', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='participaciones', to='api.partido')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='participaciones_partidos', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'constraints': [
                    models.UniqueConstraint(fields=('partido', 'usuario'), name='participacion_partido_unica'),
                ],
            },
        ),
        migrations.CreateModel(
            name='InvitacionPartido',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('estado', models.CharField(choices=[('pendiente', 'Pendiente'), ('aceptada', 'Aceptada'), ('rechazada', 'Rechazada')], default='pendiente', max_length=20)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
                ('destinatario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invitaciones_partido_recibidas', to=settings.AUTH_USER_MODEL)),
                ('partido', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invitaciones', to='api.partido')),
                ('remitente', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invitaciones_partido_enviadas', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'constraints': [
                    models.UniqueConstraint(fields=('partido', 'destinatario'), name='invitacion_partido_unica'),
                ],
            },
        ),
    ]
