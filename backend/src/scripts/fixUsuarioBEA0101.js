// Script para asegurar que el alumno BEA0101 tenga usuario con rol ALUMNO
require('dotenv').config();
const { sequelize, Usuario, Alumno } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const SEED_PASSWORD = 'password123';
const HASHED_PASSWORD = bcrypt.hashSync(SEED_PASSWORD, 10);

async function fixUsuarioBEA0101() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida.');

        const matriculaBEA0101 = 'BEA0101';
        
        // Buscar el alumno
        const alumno = await Alumno.findOne({ 
            where: { matricula: matriculaBEA0101 } 
        });

        if (!alumno) {
            console.log(`⚠️  No se encontró alumno con matrícula ${matriculaBEA0101}`);
            return;
        }

        console.log(`✅ Alumno encontrado: ${alumno.nombre} (${matriculaBEA0101})`);

        // Si ya tiene usuario_id, verificar que el usuario tenga rol ALUMNO
        if (alumno.usuario_id) {
            const usuario = await Usuario.findByPk(alumno.usuario_id);
            if (usuario) {
                if (usuario.rol === 'ALUMNO') {
                    console.log(`✅ El alumno ${matriculaBEA0101} ya tiene un usuario con rol ALUMNO vinculado: ${usuario.email}`);
                    return;
                } else {
                    // Actualizar el rol a ALUMNO
                    usuario.rol = 'ALUMNO';
                    await usuario.save();
                    console.log(`✅ Rol del usuario ${usuario.email} actualizado a ALUMNO para el alumno ${matriculaBEA0101}.`);
                    return;
                }
            } else {
                console.log(`⚠️  El alumno tiene usuario_id ${alumno.usuario_id} pero el usuario no existe. Creando nuevo usuario...`);
            }
        }

        // Buscar si hay un usuario con email relacionado
        const emailPosible = `${matriculaBEA0101.toLowerCase()}@escuela.com`;
        let usuario = await Usuario.findOne({ 
            where: { email: emailPosible } 
        });

        // Si no existe, crear uno nuevo
        if (!usuario) {
            // Buscar también por otros posibles emails
            usuario = await Usuario.findOne({
                where: {
                    email: {
                        [Op.iLike]: `%${matriculaBEA0101.toLowerCase()}%`
                    }
                }
            });

            if (!usuario) {
                usuario = await Usuario.create({
                    nombre: alumno.nombre,
                    email: emailPosible,
                    password_hash: HASHED_PASSWORD,
                    rol: 'ALUMNO'
                });
                console.log(`✅ Usuario creado para el alumno ${matriculaBEA0101}: ${emailPosible}`);
                console.log(`   Password: ${SEED_PASSWORD}`);
            }
        }

        // Si existe pero no tiene rol ALUMNO, actualizarlo
        if (usuario.rol !== 'ALUMNO') {
            usuario.rol = 'ALUMNO';
            await usuario.save();
            console.log(`✅ Rol del usuario ${usuario.email} actualizado a ALUMNO.`);
        }

        // Vincular el usuario al alumno
        alumno.usuario_id = usuario.id;
        await alumno.save();
        console.log(`✅ Usuario ${usuario.email} vinculado al alumno ${matriculaBEA0101}.`);
        console.log(`\n📝 Credenciales para iniciar sesión:`);
        console.log(`   Email: ${usuario.email}`);
        console.log(`   Password: ${SEED_PASSWORD}`);

        await sequelize.close();
        console.log('\n✅ Proceso completado exitosamente.');
    } catch (error) {
        console.error('❌ Error:', error);
        await sequelize.close();
        process.exit(1);
    }
}

fixUsuarioBEA0101();