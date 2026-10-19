# Generated manually (equivalente al resultado de `makemigrations api`)
# porque el entorno de esta sesion no permitio ejecutar ese comando.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_horariocancha_calificacioncancha'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cancha',
            name='tipo',
            field=models.CharField(
                choices=[('FÚTBOL 5', 'Fútbol 5')],
                default='FÚTBOL 5',
                max_length=20,
            ),
        ),
    ]
