import { describe, it, expect, vi } from 'vitest';
import { PlanningAgent, validatePlanningOutput, postProcessPlanning } from '../functions/core/PlanningAgent';

const mockPlanningResponse = {
  metadata: {
    oa_codigo: "OA01",
    oa_descripcion: "Comprender las relaciones entre los seres vivos y su entorno",
    nivel: "5° Básico",
    asignatura: "Ciencias Naturales",
    tema: "Ecosistemas",
    duracion_total_minutos: 90,
    taxonomia_bloom: "Analizar",
    generado_en: new Date().toISOString(),
    agente: "PlanningAgent"
  },
  contextoCurricular: {
    objetivo_aprendizaje: "OA01: Comprender las relaciones entre los seres vivos y su entorno",
    indicadores: ["Identifica componentes de un ecosistema"],
    habilidades: ["observar", "analizar"],
    habilidades_sugeridas: ["clasificar", "comparar"],
    criterios_aprendizaje: ["Explica relaciones tróficas", "Identifica productores y consumidores"],
    eje: "Vida y evolución",
    unidad: "Unidad 1: Ecosistemas"
  },
  inicio: {
    tiempo_minutos: 15,
    proposito: "Activar conocimientos previos sobre ecosistemas y conectar con experiencias cercanas",
    acciones_docente: ["Presentar imágenes de ecosistemas locales", "Preguntar qué saben los estudiantes"],
    acciones_estudiantes: ["Observar imágenes", "Compartir ideas previas"],
    recursos: ["Proyector", "Imágenes impresas"],
    evidencia: "Los estudiantes identifican al menos 3 componentes de un ecosistema",
    preguntas_metacognitivas: ["¿Qué es un ecosistema para ti?"],
    errores_frecuentes: ["Confundir hábitat con ecosistema"],
    diferenciacion: { apoyo: [], estandar: [], desafio: [] },
    dua: { representacion: [], accion_expresion: [], implicacion: [] }
  },
  desarrollo: {
    tiempo_minutos: 60,
    proposito: "Construir comprensión de las relaciones tróficas y flujos de energía",
    acciones_docente: ["Explicar cadenas tróficas con modelo", "Guiar actividad de armado de redes tróficas"],
    acciones_estudiantes: ["Armar redes tróficas en grupos", "Analizar flujo de energía"],
    recursos: ["Tarjetas de especies", "Guía de trabajo", "Pizarra"],
    evidencia: "Cada grupo presenta su red trófica completa con justificación",
    preguntas_metacognitivas: ["¿Cómo fluye la energía?", "¿Qué pasa si se rompe un eslabón?"],
    errores_frecuentes: ["Invertir flujo de energía", "Omitir descomponedores"],
    diferenciacion: { apoyo: [], estandar: [], desafio: [] },
    dua: { representacion: [], accion_expresion: [], implicacion: [] }
  },
  cierre: {
    tiempo_minutos: 15,
    proposito: "Sintetizar aprendizajes y verificar comprensión del objetivo",
    acciones_docente: ["Facilitar síntesis grupal", "Aplicar ticket de salida"],
    acciones_estudiantes: ["Compartir conclusiones", "Completar ticket individual"],
    recursos: ["Ticket de salida"],
    evidencia: "Ticket de salida con 3 ideas clave sobre relaciones",
    preguntas_metacognitivas: ["¿Qué aprendí hoy?", "¿Qué duda me queda?"],
    errores_frecuentes: [],
    diferenciacion: { apoyo: [], estandar: [], desafio: [] },
    dua: { representacion: [], accion_expresion: [], implicacion: [] }
  },
  evaluacionFormativa: {
    estrategias: ["Observación en grupos", "Ticket de salida", "Preguntas de verificación"],
    evidencias_observables: ["Participación activa", "Ticket completado correctamente", "Explicación oral coherente"],
    lista_cotejo: ["Identifica productores", "Identifica consumidores", "Explica flujo de energía", "Ubica descomponedores"],
    opciones_respuesta: ["oral", "visual", "escrita breve", "corporal", "señalamiento"],
    retroalimentacion_docente: ["Buen trabajo identificando niveles tróficos", "Revisar rol de descomponedores"]
  },
  adaptacionesDUA: {
    apoyo: [
      "Modelaje con tarjetas de especies y elección entre 2-3 opciones",
      "Trabajo en pareja con roles: uno busca evidencia, otro comunica",
      "Frases iniciadoras: 'El productor es... porque...'",
      "Cierre con tarjeta de emoción sobre lo aprendido"
    ],
    estandar: [
      "Armar red trófica completa con 6-8 especies",
      "Justificar posición de cada organismo usando vocabulario: productor, consumidor, descomponedor",
      "Comparar redes tróficas de distintos ecosistemas"
    ],
    desafio: [
      "Predecir impacto de eliminar un eslabón de la red",
      "Crear red trófica de ecosistema local (quebrada, cerro cercano)",
      "Diseñar experimento mental: ¿qué pasa si desaparecen los descomponedores?"
    ],
    representacion: [
      "Imágenes grandes de organismos con etiquetas visuales",
      "Vocabulario clave visible: productor, consumidor, descomponedor, cadena trófica",
      "Modelo físico de red trófica en pizarra con flechas de energía"
    ],
    accion_expresion: [
      "Permitir respuesta oral, diagrama, texto breve o presentación grupal",
      "Ofrecer organizador gráfico con espacios para cada nivel trófico",
      "Aceptar evidencia equivalente sin bajar expectativa curricular"
    ],
    implicacion: [
      "Elección de ecosistema local (quebrada, cerro, parque) para conectar con entorno",
      "Trabajo en roles rotativos: investigador, diseñador, presentador",
      "Retroalimentación nombrando logro específico: 'Lograste ubicar bien a los descomponedores'"
    ],
    barreras_identificadas: [
      "Vocabulario técnico: productor, consumidor, descomponedor, cadena trófica",
      "Atención sostenida durante armado de red trófica grupal",
      "Dificultad para expresar justificación por escrito"
    ],
    adecuaciones_por_perfil: {
      TEA: [
        "Anticipar secuencia visual con pasos numerados",
        "Opción de trabajo individual o pareja fija",
        "Reducir estímulos: una tarjeta a la vez, espacio ordenado"
      ],
      TDAH: [
        "Dividir actividad en pasos de 5-10 min con señal visual de avance",
        "Permitir pausa activa entre armado y justificación",
        "Usar temporizador visible para cada fase"
      ],
      lectoras: [
        "Banco de palabras con imágenes: productor 🌱, consumidor 🐛, descomponedor 🍄",
        "Aceptar respuesta oral o diagrama en lugar de texto extenso",
        "Leer consignas en voz alta y modelar ejemplo"
      ],
      NEE: [
        "Material manipulativo: tarjetas magnéticas para armar en pizarra",
        "Apoyo visual: flechas de energía pre-impresas",
        "Reducir número de especies a 4-5 en lugar de 6-8"
      ],
      alta_capacidad: [
        "Pedir justificación de 2+ conexiones con evidencia",
        "Invitar a comparar red trófica local con marina/desierto",
        "Rol de tutor par: explicar flujo de energía a compañero"
      ]
    }
  },
  recursos: [
    { titulo: "Tarjetas de especies nativas", tipo: "manipulativo", descripcion: "60 tarjetas con organismos de ecosistemas chilenos", url: "https://ejemplo.cl/tarjetas" },
    { titulo: "Guía de redes tróficas", tipo: "documento", descripcion: "Organizador gráfico paso a paso", url: "https://ejemplo.cl/guia" },
    { titulo: "Video: Flujo de energía", tipo: "video", descripcion: "3 min animación de cadena trófica", url: "https://ejemplo.cl/video" }
  ],
  erroresFrecuentes: [
    "Invertir la dirección de las flechas de energía (del consumidor al productor)",
    "Omitir a los descomponedores como cierre del ciclo",
    "Confundir hábitat (dónde vive) con nicho trófico (qué come)"
  ],
  preguntasMetacognitivas: [
    "¿Cómo sé que mi red trófica está bien armada?",
    "¿Qué pasaría en mi ecosistema si desaparecieran las abejas?",
    "¿En qué me equivoqué al inicio y cómo lo corregí?"
  ],
  extension: {
    tarea_domiciliaria: "Observar un espacio verde cercano e identificar 3 organismos y su posible rol trófico",
    profundizacion: "Investigar red trófica de ecosistema marino costero chileno",
    conexion_interdisciplinar: "Graficar pirámide de energía en Matemáticas; escribir relato desde perspectiva de un organismo en Lenguaje"
  },
  seguimientoDocente: {
    proximos_pasos: [
      "Profundizar en descomponedores y ciclos de materia",
      "Evaluar impacto humano en redes tróficas locales"
    ],
    alertas: [
      "Revisar vocabulario técnico en próxima clase",
      "Monitorear estudiantes que omitieron descomponedores"
    ],
    registro_sugerido: [
      "Ticket de salida individual",
      "Rúbrica de red trófica grupal",
      "Observación de participación en roles"
    ]
  }
};

const mockEnv = {
  AI: {
    run: vi.fn().mockResolvedValue(JSON.stringify(mockPlanningResponse))
  }
};

describe('PlanningAgent integration', () => {
  it('should generate premium planning with full structure', async () => {
    const agent = new PlanningAgent(mockEnv);
    
    const pedagogicalContext = {
      nivel: "5° Básico",
      asignatura: "Ciencias Naturales",
      tema: "Ecosistemas",
      oa: {
        codigo: "OA01",
        descripcion: "Comprender las relaciones entre los seres vivos y su entorno",
        habilidades_csv: "observar, analizar, clasificar",
        unidad_titulo: "Unidad 1: Ecosistemas",
        unidad_numero: 1,
        eje: "Vida y evolución",
        eje_descripcion: "Entender la vida y sus procesos",
        bloom_level: "Analizar"
      },
      indicadores: [
        { id: 1, indicator_text: "Identifica componentes de un ecosistema", observable_action: "Identifica", bloom_level: "Analizar", skill_tag: "observar" }
      ],
      habilidades: ["observar", "analizar"],
      habilidades_sugeridas: ["clasificar", "comparar"],
      criterios_aprendizaje: ["Explica relaciones tróficas"],
      habilidades_curriculares: [],
      contexto_clase: {
        nivel: "5° Básico",
        curso: "5° Básico",
        asignatura: "Ciencias Naturales",
        cantidad_estudiantes: 30,
        estudiantes_nee: 2,
        tipos_nee: ["TEA", "TDAH"],
        recursos_disponibles: ["Pizarra", "Proyector", "Material manipulativo"],
        duracion_minutos: 90,
        metodologia_sugerida: "Indagación guiada"
      },
      planificacion_existente: { tiene_planificacion: false },
      recursos: [],
      dua: {
        nivel_apoyo: [],
        nivel_estandar: [],
        nivel_desafio: [],
        representacion: [],
        accion_expresion: [],
        implicacion: []
      },
      evaluaciones_relacionadas: [],
      productos_previos: [],
      barreras_aprendizaje: [
        "Vocabulario técnico: productor, consumidor, descomponedor",
        "Atención sostenida en trabajo grupal",
        "Expresión escrita de justificaciones"
      ],
      adaptaciones_sugeridas: {
        TEA: ["Anticipar secuencia", "Opción trabajo individual"],
        TDAH: ["Pasos cortos", "Pausas activas"],
        lectoras: ["Banco de palabras", "Respuesta oral"],
        NEE: ["Material manipulativo", "Apoyo visual"],
        alta_capacidad: ["Justificación extendida", "Tutor par"]
      }
    };

    const result = await agent.generate({}, { pedagogicalContext, userParams: { nivel: "5° Básico", asignatura: "Ciencias Naturales", tema: "Ecosistemas" } });
    
    expect(result.content).toBeDefined();
    expect(result.validation.passed).toBe(true);
    expect(result.metadata.agent).toBe('PlanningAgent');
    
    const planning = result.content;
    
    // Verify metadata
    expect(planning.metadata.oa_codigo).toBe("OA01");
    expect(planning.metadata.nivel).toBe("5° Básico");
    expect(planning.metadata.asignatura).toBe("Ciencias Naturales");
    expect(planning.metadata.tema).toBe("Ecosistemas");
    expect(planning.metadata.duracion_total_minutos).toBe(90);
    
    // Verify contextoCurricular
    expect(planning.contextoCurricular.objetivo_aprendizaje).toContain("OA01");
    expect(planning.contextoCurricular.indicadores).toContain("Identifica componentes de un ecosistema");
    expect(planning.contextoCurricular.habilidades.length).toBeGreaterThan(0);
    expect(planning.contextoCurricular.criterios_aprendizaje.length).toBeGreaterThan(0);
    
    // Verify phases
    expect(planning.inicio.tiempo_minutos).toBe(15);
    expect(planning.desarrollo.tiempo_minutos).toBe(60);
    expect(planning.cierre.tiempo_minutos).toBe(15);
    expect(planning.inicio.acciones_docente.length).toBeGreaterThan(0);
    expect(planning.inicio.acciones_estudiantes.length).toBeGreaterThan(0);
    expect(planning.inicio.evidencia.length).toBeGreaterThan(10);
    
    // Verify evaluacionFormativa
    expect(planning.evaluacionFormativa.estrategias.length).toBeGreaterThan(0);
    expect(planning.evaluacionFormativa.evidencias_observables.length).toBeGreaterThan(0);
    expect(planning.evaluacionFormativa.lista_cotejo.length).toBeGreaterThan(0);
    expect(planning.evaluacionFormativa.opciones_respuesta).toContain("oral");
    expect(planning.evaluacionFormativa.opciones_respuesta).toContain("visual");
    
    // Verify adaptacionesDUA
    expect(planning.adaptacionesDUA.apoyo.length).toBeGreaterThan(0);
    expect(planning.adaptacionesDUA.estandar.length).toBeGreaterThan(0);
    expect(planning.adaptacionesDUA.desafio.length).toBeGreaterThan(0);
    expect(planning.adaptacionesDUA.representacion.length).toBeGreaterThan(0);
    expect(planning.adaptacionesDUA.accion_expresion.length).toBeGreaterThan(0);
    expect(planning.adaptacionesDUA.implicacion.length).toBeGreaterThan(0);
    expect(planning.adaptacionesDUA.barreras_identificadas.length).toBeGreaterThan(0);
    expect(planning.adaptacionesDUA.adecuaciones_por_perfil.TEA).toBeDefined();
    expect(planning.adaptacionesDUA.adecuaciones_por_perfil.TDAH).toBeDefined();
    expect(planning.adaptacionesDUA.adecuaciones_por_perfil.lectoras).toBeDefined();
    expect(planning.adaptacionesDUA.adecuaciones_por_perfil.NEE).toBeDefined();
    expect(planning.adaptacionesDUA.adecuaciones_por_perfil.alta_capacidad).toBeDefined();
    
    // Verify recursos
    expect(planning.recursos.length).toBeGreaterThan(0);
    expect(planning.recursos[0].titulo).toBeDefined();
    
    // Verify erroresFrecuentes
    expect(planning.erroresFrecuentes.length).toBeGreaterThanOrEqual(3);
    
    // Verify preguntasMetacognitivas
    expect(planning.preguntasMetacognitivas.length).toBeGreaterThanOrEqual(3);
    
    // Verify extension
    expect(planning.extension.tarea_domiciliaria).toBeDefined();
    expect(planning.extension.profundizacion).toBeDefined();
    expect(planning.extension.conexion_interdisciplinar).toBeDefined();
    
    // Verify seguimientoDocente
    expect(planning.seguimientoDocente.proximos_pasos.length).toBeGreaterThan(0);
    expect(planning.seguimientoDocente.alertas.length).toBeGreaterThan(0);
    expect(planning.seguimientoDocente.registro_sugerido.length).toBeGreaterThan(0);
  });
});