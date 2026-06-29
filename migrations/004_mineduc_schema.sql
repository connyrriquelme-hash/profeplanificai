-- 1. Tabla de Niveles Educativos (Ej: 1° Básico, 1° Medio)
CREATE TABLE IF NOT EXISTS niveles (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    orden INTEGER NOT NULL -- Útil para ordenar en el selector (1 al 12)
);

-- 2. Tabla de Asignaturas (Ej: Lenguaje, Matemática)
CREATE TABLE IF NOT EXISTS asignaturas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL
);

-- 3. Tabla Pivote (Relación Nivel - Asignatura)
-- Un nivel tiene muchas asignaturas, y una asignatura se da en muchos niveles.
CREATE TABLE IF NOT EXISTS nivel_asignatura (
    nivel_id TEXT NOT NULL,
    asignatura_id TEXT NOT NULL,
    PRIMARY KEY (nivel_id, asignatura_id),
    FOREIGN KEY (nivel_id) REFERENCES niveles(id) ON DELETE CASCADE,
    FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON DELETE CASCADE
);

-- 4. Tabla de Objetivos de Aprendizaje (OA)
CREATE TABLE IF NOT EXISTS objetivos_aprendizaje (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL, -- Ej: "OA 1"
    descripcion TEXT NOT NULL,
    eje_tematico TEXT, -- Ej: "Números y Operaciones" o "Lectura"
    nivel_id TEXT NOT NULL,
    asignatura_id TEXT NOT NULL,
    FOREIGN KEY (nivel_id) REFERENCES niveles(id) ON DELETE CASCADE,
    FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON DELETE CASCADE
);

-- 5. Tabla de Indicadores de Evaluación (Amarrados a un OA específico)
CREATE TABLE IF NOT EXISTS indicadores_evaluacion (
    id TEXT PRIMARY KEY,
    descripcion TEXT NOT NULL,
    oa_id TEXT NOT NULL,
    FOREIGN KEY (oa_id) REFERENCES objetivos_aprendizaje(id) ON DELETE CASCADE
);

-- 6. Tabla de Habilidades (Generalmente asociadas a la Asignatura por Ciclo)
CREATE TABLE IF NOT EXISTS habilidades (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    asignatura_id TEXT NOT NULL,
    FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON DELETE CASCADE
);

-- ÍNDICES PARA VELOCIDAD DE BÚSQUEDA (Crucial para el Wizard)
CREATE INDEX idx_oa_nivel_asignatura ON objetivos_aprendizaje(nivel_id, asignatura_id);
CREATE INDEX idx_indicadores_oa ON indicadores_evaluacion(oa_id);
