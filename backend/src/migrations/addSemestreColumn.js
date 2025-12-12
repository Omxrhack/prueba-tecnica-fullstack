// Script para agregar columna semestre a materias de forma segura
const { sequelize } = require('../models');

async function migrateSemestre() {
    try {
        console.log('Iniciando migración de columna semestre...');
        
        // 1. Agregar columna como nullable primero
        await sequelize.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'materias' AND column_name = 'semestre'
                ) THEN
                    ALTER TABLE "materias" ADD COLUMN "semestre" INTEGER;
                    -- Asignar semestre aleatorio entre 1-8 a materias existentes
                    UPDATE "materias" SET "semestre" = (FLOOR(RANDOM() * 8) + 1) WHERE "semestre" IS NULL;
                    ALTER TABLE "materias" ALTER COLUMN "semestre" SET NOT NULL;
                    COMMENT ON COLUMN "materias"."semestre" IS 'Semestre al que pertenece la materia (1-8)';
                END IF;
            END $$;
        `);
        
        console.log(' Migración de columna semestre completada.');
    } catch (error) {
        console.error(' Error en migración:', error);
        throw error;
    }
}

if (require.main === module) {
    migrateSemestre()
        .then(() => {
            console.log('Migración finalizada.');
            process.exit(0);
        })
        .catch(err => {
            console.error('Error:', err);
            process.exit(1);
        });
}

module.exports = migrateSemestre;
