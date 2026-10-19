# Generated manually (equivalente al resultado de `makemigrations api`)
# porque el entorno de esta sesion no permitio ejecutar ese comando.

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0010_notificacion'),
    ]

    operations = [
        migrations.CreateModel(
            name='HorarioCancha',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dia_semana', models.PositiveSmallIntegerField(choices=[(0, 'Lunes'), (1, 'Martes'), (2, 'Miércoles'), (3, 'Jueves'), (4, 'Viernes'), (5, 'Sábado'), (6, 'Domingo')])),
                ('hora', models.TimeField()),
                ('cancha', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='horarios', to='api.cancha')),
            ],
            options={
                'ordering': ['dia_semana', 'hora'],
                'constraints': [
                    models.UniqueConstraint(fields=('cancha', 'dia_semana', 'hora'), name='horario_cancha_unico'),
                ],
            },
        ),
        migrations.CreateModel(
            name='CalificacionCancha',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('valor', models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
                ('cancha', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='calificaciones', to='api.cancha')),
                ('evaluador', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='calificaciones_canchas_realizadas', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'constraints': [
                    models.UniqueConstraint(fields=('cancha', 'evaluador'), name='calificacion_cancha_unica'),
                ],
            },
        ),
    ]
