# Generated manually (equivalente al resultado de `makemigrations api`)
# porque el entorno de esta sesion no permitio ejecutar ese comando.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0007_perfil_posicion_pierna_habil_choices'),
    ]

    operations = [
        migrations.CreateModel(
            name='Cancha',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=150)),
                ('tipo', models.CharField(
                    choices=[
                        ('FÚTBOL 5', 'Fútbol 5'),
                        ('FÚTBOL 7', 'Fútbol 7'),
                        ('FÚTBOL 11', 'Fútbol 11'),
                    ],
                    default='FÚTBOL 5',
                    max_length=20,
                )),
                ('direccion', models.CharField(max_length=200)),
                ('telefono', models.CharField(max_length=30)),
                ('precio', models.PositiveIntegerField()),
                ('imagen', models.ImageField(blank=True, null=True, upload_to='canchas/')),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
                ('dueno', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='canchas',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
    ]
