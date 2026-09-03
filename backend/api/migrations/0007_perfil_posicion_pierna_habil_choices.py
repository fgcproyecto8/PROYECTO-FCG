# Generated manually (equivalente al resultado de `makemigrations api`)
# porque el entorno de esta sesion no permitio ejecutar ese comando.
# Agrega choices= a Perfil.posicion y Perfil.pierna_habil. No modifica
# la columna en la base de datos (choices es solo validacion a nivel
# de Django/DRF), y los valores usados coinciden exactamente con los
# que el frontend ya enviaba.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_solicitudamistad'),
    ]

    operations = [
        migrations.AlterField(
            model_name='perfil',
            name='posicion',
            field=models.CharField(
                blank=True,
                choices=[
                    ('Delantero', 'Delantero'),
                    ('Mediocampista', 'Mediocampista'),
                    ('Defensor', 'Defensor'),
                    ('Portero', 'Portero'),
                ],
                max_length=50,
            ),
        ),
        migrations.AlterField(
            model_name='perfil',
            name='pierna_habil',
            field=models.CharField(
                blank=True,
                choices=[
                    ('Derecha', 'Derecha'),
                    ('Izquierda', 'Izquierda'),
                ],
                max_length=20,
            ),
        ),
    ]
