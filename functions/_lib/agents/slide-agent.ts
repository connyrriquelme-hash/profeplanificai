import type { Env } from '../../_middleware';

export interface SlideResource {
  id: string;
  slide_id: string;
  resource_id: string;
  title: string;
  slide_type: 'content' | 'practice' | 'reflection' | 'assessment';
  content: string;
  interactive_elements?: string;
  visual_elements?: string;
  time_estimation?: number;
  learning_objectives?: string[];
  activities?: string[];
  created_at: string;
  updated_at: string;
}

export interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  structure: string;
  slide_types: string;
  template_content: string;
  grade_levels: string;
  subjects: string;
  created_at: string;
  updated_at: string;
}

export class SlideAgent {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async generateSlides(
    resourceId: string,
    userId: string,
    numSlides: number = 15,
    templateId?: string,
    type: 'lesson' | 'workbook' | 'presentation' = 'lesson'
  ): Promise<{ slides: SlideResource[]; presentation: any }> {
    const now = new Date().toISOString();
    const presentationId = `presentation-${crypto.randomUUID()}`;

    const template = templateId 
      ? await this.getSlideTemplateById(templateId)
      : await this.getDefaultSlideTemplate(type);

    const generatedSlides = [];

    for (let i = 1; i <= numSlides; i++) {
      const slideId = `slide-${crypto.randomUUID()}`;

      const slideContent = this.generateSlideContent(
        i,
        numSlides,
        template.template_content,
        type
      );

      const slide: SlideResource = {
        id: slideId,
        slide_id: `SL${i.toString().padStart(3, '0')}`,
        resource_id: resourceId,
        title: slideContent.title,
        slide_type: this.determineSlideType(i, numSlides, type),
        content: slideContent.content,
        interactive_elements: this.generateInteractiveElements(i, type),
        visual_elements: this.generateVisualElements(i, type),
        time_estimation: this.calculateTimeEstimation(type),
        learning_objectives: this.extractLearningObjectivesFromContent(slideContent.content),
        activities: this.generateActivities(i, type),
        created_at: now,
        updated_at: now,
      };

      generatedSlides.push(slide);

      await this.env.DB.prepare(
        `INSERT INTO slide_resources (
          id, slide_id, resource_id, title, slide_type,
          content, interactive_elements, visual_elements,
          time_estimation, learning_objectives, activities,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        slideId,
        slide.slide_id,
        resourceId,
        slide.title,
        slide.slide_type,
        slide.content,
        slide.interactive_elements,
        slide.visual_elements,
        slide.time_estimation,
        JSON.stringify(slide.learning_objectives),
        JSON.stringify(slide.activities),
        now,
        now
      ).run();
    }

    await this.env.DB.prepare(
      `INSERT INTO generated_presentations (
        id, user_id, resource_id, title, slide_count,
        presentation_format, presentation_content, theme, layout,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      presentationId,
      userId,
      resourceId,
      `Presentación generada - ${type}`, // title
      numSlides,
      type,
      JSON.stringify({ slides: generatedSlides.map(s => ({ id: s.id, title: s.title, type: s.slide_type })) }),
      'modern',
      'professional',
      now,
      now
    ).run();

    return {
      slides: generatedSlides,
      presentation: {
        id: presentationId,
        title: `Presentación generada - ${type}`, // title
        slide_count: numSlides,
        format: type,
        content: JSON.stringify({ slides: generatedSlides.map(s => ({ id: s.id, title: s.title, type: s.slide_type })) }),
        theme: 'modern',
        layout: 'professional',
        created_at: now,
      },
    };
  }

  private async getSlideTemplateById(templateId: string): Promise<SlideTemplate> {
    const { results } = await this.env.DB.prepare(
      `SELECT id, name, description, structure, slide_types,
               template_content, grade_levels, subjects, created_at, updated_at
       FROM slide_templates
       WHERE id = ?`
    ).bind(templateId).all();

    if (results.length === 0) {
      throw new Error(`Slide template not found: ${templateId}`);
    }

    return results[0] as SlideTemplate;
  }

  private async getDefaultSlideTemplate(type: string): Promise<SlideTemplate> {
    const { results } = await this.env.DB.prepare(
      `SELECT id, name, description, structure, slide_types,
               template_content, grade_levels, subjects, created_at, updated_at
       FROM slide_templates
       WHERE name LIKE ?
       LIMIT 1`
    ).bind(`%${type}%`).all();

    if (results.length === 0) {
      throw new Error(`Default slide template not found for type: ${type}`);
    }

    return results[0] as SlideTemplate;
  }

  private generateSlideContent(
    slideNumber: number,
    totalSlides: number,
    template: string,
    type: string
  ): { title: string; content: string } {
    const titles = {
      lesson: [
        'Bienvenida y establecimiento del aprendizaje', 'Desmitificación de Objetos de Aprendizaje',
        'Antecedentes y relevancia', 'Conceptos clave y déclamation', 'Ejemplos y aplicaciones',
        'Práctica guiada y refuerzo', 'Actividades de cierre y reflexión',
        'Evaluación formativa', 'Consultas y preguntas frecuentes',
        'Laboratorio / Practicum', 'Trabajo colaborativo en clase',
        'Evaluación sumativa', 'Sesión de clausura y compromisos', 'Revisión y reflexión metacognitiva',
        'Tarea para casa y próximos pasos',
      ],
      workbook: [
        'Unidad de aprendizaje: Evaluación de necesidades', 'Desmitificación de OA', 'Recursos previos',
        'Fundamentos conceptuales', 'Conceptos esenciales', 'Conexiones con la vida real',
        'Mapas mentales y conceptuales', 'Eventos de aprendizaje', 'Actividades de práctica',
        'Evaluaciones formativas', 'Retroalimentación y corrección', 'Para llevar a casa',
      ],
      presentation: [
        'Objetivo de la presentación', 'Introducción al tema', 'Desarrollo del contenido',
        'Ejemplos y casos prácticos', 'Actividades interactivas', 'Evaluación de aprendizaje',
        'Conclusión yResumen', 'Próximos pasos y recursos adicionales',
      ],
    };

    const contentTemplates = {
      lesson: [
        'Crear un ambiente de aprendizaje positivo estableciendo un propósito claro para la clase.',
        'Explicar cada OA utilizando lenguaje accesible, analogías y ejemplos del contexto nacional chileno.',
        'Presentar antecedentes relevantes, including logros de aprendizajes previos y relevancia de hoy.',
        'Demostrar conceptos clave mediante el uso de pizarras, ayudas visuales, y ejemplos concretos.',
        'Presentar casos de estudio o problemas que ilustren la aplicación del concepto en contextos reales.',
        'Demostrar procedimientos o habilidades clave mediante modelos paso a paso.',
        'Supervisar y guiar actividades de práctica colaborativa entre estudiantes.',
        'Recoger evidencia de aprendizaje mediante incdelaaficiones formativas.',
        'Respondir preguntas frecuentes que surjan en el salón de clases.',
        'Demostraciones prácticas o laboratorios en el aula utilizando materiales disponibles.',
        'Facilitar discusiones colaborativas donde estudiantes resuelvan problemas juntos.',
        'Realizar breves evaluaciones sumativas para recoger evidencia de logros.',
        'Realizar una actividad de cierre que sintetice los aprendidajes clave.',
        'Guía a los estudiantes en una reflexión metacognitiva sobre su proceso de aprendizaje.',
        'Asignar tareas claras para el hogar y explicar los próximos pasos de la clase.',
      ],
      workbook: [
        'Evaluar el nivel de conocimiento previo de los estudiantes sobre el tema.',
        'Explicar cada OA utilizando analogías y ejemplos del contexto chileno.',
        'Presentar antecedentes relevantes que conecten con experiencia diaria.',
        'Desarrollar conceptos clave mediante explicaciones estructuradas y mapas conceptuales.',
        'Presentar ejemplos cotidianos y de la cultura chilena para ilustrar conceptos.',
        'Crear mapas mentales para visualizar conexiones entre ideas clave.',
        'Diseñar eventos de aprendizaje específicos y medibles.',
        'Proporcionar actividades de práctica variadas con diferentes niveles de dificultad.',
        'Ofrecer retroalimentación inmediata mediante rúbricas y pautas de evaluación.',
        'Reconocer y premiar el esfuerzo y progreso de los estudiantes.',
        'Proveer materiales adicionales para profundización según necesidad.',
        'Proveer tareas claras y sistemáticas para reforzar aprendidajes.',
      ],
      presentation: [
        'Presentar objetivo claro y metodología de la presentación.',
        'Introducir el tema mediante historias, preguntas o hechos impactantes.',
        'Desarrollar el contenido de manera estructurada y visual.',
        'Utilizar ejemplos locales y casos de estudio chilenos.',
        'Incluir actividades interactivas para mayor participación.',
        'Demostrar técnicas o procedimientos relevantes.',
        'Proporcionar tiempo para preguntas y respuestas.',
        'Concluir con resumen y puntos clave.',
      ],
    };

    const titleList = titles[type] || titles.lesson;
    const contentList = contentTemplates[type] || contentTemplates.lesson;

    const title = slideNumber <= titleList.length
      ? titleList[slideNumber - 1]
      : `Slide ${slideNumber}: Tópico educativo clave`;

    const content = slideNumber <= contentList.length
      ? contentList[slideNumber - 1]
      : `Contenido del slide ${slideNumber} sobre temática educativa relevante para el currículo chileno.`;

    return { title, content };
  }

  private determineSlideType(
    slideNumber: number,
    totalSlides: number,
    type: string
  ): SlideResource['slide_type'] {
    const distribution = {
      lesson: {
        intro: [1, 2],
        develop: [3, 4, 5, 6, 7],
        practice: [8, 9, 10, 11, 12, 13, 14, 15],
        reflection: [14, 15],
      },
      workbook: {
        assessment: [1, 2],
        intro: [3, 4, 5],
        development: [6, 7, 8, 9],
        practice: [10, 11, 12],
        reflection: [13, 14],
        closure: [15],
      },
      presentation: {
        opening: [1, 2],
        content: [3, 4, 5, 6, 7, 8],
        examples: [9, 10, 11],
        interaction: [12, 13],
        closing: [14, 15],
      },
    };

    const categories = distribution[type as keyof typeof distribution] || distribution.lesson;

    for (const [typeName, range] of Object.entries(categories)) {
      if (slideNumber >= range[0] && slideNumber <= range[1]) {
        return typeName as SlideResource['slide_type'];
      }
    }

    return 'content';
  }

  private generateInteractiveElements(slideNumber: number, type: string): string {
    const elements = {
      lesson: [
        `Pregunta gatillo sobre OA ${slideNumber}`, 'Discusión en parejas', 'Actividad en grupo de 3-4 estudiantes',
        'Juego de Kahoot/uQuiz', 'Debate estructurado', 'Actividad de roles',
        'Mapa mental colaborativo', 'Juego de roles', 'Supervisión de prácticas',
      ],
      workbook: [
        `Consigna de autoregulación OA ${slideNumber}`, 'Ejercicio de reflexión', 'Actividad de salida',
        'Juego de completar espacios', 'Arrastre y ordenamiento', 'Mapa mental',
        'Cuadro de doble entrada', 'Diagrama de flujo', 'Escala de Likert',
      ],
      presentation: [
        `Pregunta de apertura para slide ${slideNumber}`, 'Votación en AAprender', 'Wiki colaborativo',
        'Mapa de lluvia de ideas', 'Encuesta de retroalimentación', 'Cuestionario de exitación',
        'Caja de comentarios', 'Experiencia de realidad aumentada',
      ],
    };

    const typeElements = elements[type as keyof typeof elements] || elements.lesson;
    const index = (slideNumber - 1) % typeElements.length;
    return typeElements[index];
  }

  private generateVisualElements(slideNumber: number, type: string): string {
    const elements = {
      lesson: [
        'Pizarra con diagrama', 'Imagen representativa', 'Organize gráfico', 'Pin electrónico',
        'Diagrama de flujo', 'Fotografía', 'Gráfico de barras', 'Mapa conceptual',
      ],
      workbook: [
        'Esquema de referencia', 'Ilustración del concepto', 'Tabla de comparación',
        'Gráfico circulante', 'Imagen de ejemplo', 'Diagrama simple', 'Paleta de colores',
      ],
      presentation: [
        'Portada con imagen impactante', 'Gráfico animado', 'Imagen de apertura', 'Video introductorio',
        'Diagrama con colores', 'Fotografía de contexto', 'Infografía', 'Objeto real',
      ],
    };

    const typeElements = elements[type as keyof typeof elements] || elements.lesson;
    const index = (slideNumber - 1) % typeElements.length;
    return typeElements[index];
  }

  private calculateTimeEstimation(type: string): number {
    const baseTime = {
      lesson: 8,
      workbook: 12,
      presentation: 10,
    };
    return baseTime[type as keyof typeof baseTime] || 10;
  }

  private extractLearningObjectivesFromContent(content: string): string[] {
    const objectives = [
      'Comprende los conceptos básicos del OA',
      'Aplica el conocimiento en situaciones nuevas',
      'Resuelve problemas relacionados con el OA',
      'Explica el significado y relevancia del OA',
      'Trabaja colaborativamente en actividades relacionadas con el OA',
      'Evalúa su propio aprendizaje respecto al OA',
    ];

    const selectedObjectives = [];
    const numObjectives = Math.min(3, objectives.length);

    for (let i = 0; i < numObjectives; i++) {
      const index = (i * 3 + slideNumber) % objectives.length;
      selectedObjectives.push(objectives[index]);
    }

    return selectedObjectives;
  }

  private generateActivities(slideNumber: number, type: string): string[] {
    const activities = {
      lesson: [
        `Actividad ${slideNumber}: Análisis de OA`, `Actividad ${slideNumber}: Discusión en clase`, `Actividad ${slideNumber}: Práctica colaborativa`,
        `Actividad ${slideNumber}: Juego educativo`, `Actividad ${slideNumber}: Rol-play`, `Actividad ${slideNumber}: Evaluación formativa`,
      ],
      workbook: [
        `Actividad ${slideNumber}: Comprendiendo el concepto`, `Actividad ${slideNumber}: Ejercicio de práctica`, `Actividad ${slideNumber}: Autorreflexión`,
        `Actividad ${slideNumber}: Resolución de problemas`, `Actividad ${slideNumber}: Juego de completar espacios`, `Actividad ${slideNumber}: Diario de aprendizaje`,
      ],
      presentation: [
        `Actividad ${slideNumber}: Participación en polling`, `Actividad ${slideNumber}: Colaboración en wiki`, `Actividad ${slideNumber}: Encuesta de retroalimentación`,
        `Actividad ${slideNumber}: Foro de discusión`, `Actividad ${slideNumber}: Juego en equipo`, `Actividad ${slideNumber}: Cuestionario de salida`,
      ],
    };

    const typeActivities = activities[type as keyof typeof activities] || activities.lesson;
    return typeActivities.slice(0, 3);
  }
}