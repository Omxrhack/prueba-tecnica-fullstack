// Script para agregar columna unidad a calificaciones de forma segura
const { sequelize } = require('../models');

async function migrateUnidad() {
    try {
        console.log(' Iniciando migración de columna unidad...');
        
        // 1. Agregar columna como nullable primero
        await sequelize.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'calificaciones' AND column_name = 'unidad'
                ) THEN
                    ALTER TABLE "calificaciones" ADD COLUMN "unidad" INTEGER;
                    UPDATE "calificaciones" SET "unidad" = 1 WHERE "unidad" IS NULL;
                    ALTER TABLE "calificaciones" ALTER COLUMN "unidad" SET NOT NULL;
                    COMMENT ON COLUMN "calificaciones"."unidad" IS 'Número de unidad (1-5)';
                END IF;
            END $$;
        `);
        
        console.log('Migración de columna unidad completada.');
    } catch (error) {
        console.error('Error en migración:', error);
        throw error;
    }
}

if (require.main === module) {
    migrateUnidad()
        .then(() => {
            console.log('Migración finalizada.');
            process.exit(0);
        })
        .catch(err => {
            console.error('Error:', err);
            process.exit(1);
        });
}

module.exports = migrateUnidad;
