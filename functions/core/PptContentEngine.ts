import { PptDeckSchema, TITLE_MAX, SUBTITLE_MAX, BULLET_MAX, type PptDeck, type Slide } from '../../schemas/PptDeckSchema';
import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv, PedagogicalPlan } from './types';
import { inferRangoEtario } from './pedagogicalUtils';

export { inferRangoEtario };

export function buildSystemPrompt(plan: PedagogicalPlan): string {
  const rangoEtario = inferRangoEtario(plan.curso);

  return `Eres un profesor experto en didáctica y diseño de presentaciones educativas para el currículum chileno. Generas contenido para presentaciones PPT que serán usadas en clase.

CONTEXTO DE ESTA CLASE:
- Tema: ${plan.tema}
- Curso: ${plan.curso} — rango etario aproximado: ${rangoEtario}
- Objetivo de Aprendizaje (OA) oficial MINEDUC a cubrir: "${plan.objetivo_aprendizaje}"

REGLA MÁS IMPORTANTE: el texto del OA de arriba es el objetivo curricular formal, escrito para docentes — NUNCA lo copies literalmente en un título o bullet. Reformúlalo siempre con tus propias palabras, en lenguaje simple y concreto, adaptado exactamente al rango etario indicado arriba. Todo el contenido (títulos, bullets, ejemplos) debe estar atado al tema y al OA reales de esta clase, no ser genérico.

REGLAS OBLIGATORIAS:
1. Cada slide debe tener un título claro y conciso (máximo 80 caracteres). El slide "title" puede tener además un subtitle breve (máximo 120 caracteres) — nunca copies ahí el objetivo de aprendizaje completo, eso va en su propio slide de bullets, y siempre reformulado.
2. Los slides de tipo "bullets" deben tener ENTRE 2 Y 6 bullets, nunca menos de 2 ni más de 6. Cada bullet máximo 140 caracteres, en lenguaje simple (no copiado del OA).
3. Los slides de tipo "image_text" deben tener un imageQuery descriptivo (máximo 100 caracteres) para buscar una imagen relacionada.
4. Los slides de tipo "comparison" deben tener left y right con label y al menos 1 point cada uno.
5. Los slides de tipo "quote" deben tener text (máximo 200 caracteres) y author opcional.
6. El deck debe tener entre 5 y 20 slides.
7. NO incluyas explicaciones ni texto adicional fuera del JSON.
8. Responde ÚNICAMENTE con JSON válido que cumpla el esquema PptDeckSchema.

ESTRUCTURA JSON OBLIGATORIA:
{
  "slides": [
    { "layout": "title", "title": "Título de la presentación", "subtitle": "Subtítulo opcional" },
    { "layout": "bullets", "title": "Título del slide", "bullets": ["punto 1", "punto 2"] },
    { "layout": "image_text", "title": "Título", "body": "Texto descriptivo", "imageQuery": "descripción de imagen" },
    { "layout": "comparison", "title": "Comparación", "left": { "label": "Izquierda", "points": ["punto"] }, "right": { "label": "Derecha", "points": ["punto"] } },
    { "layout": "quote", "text": "Cita educativa", "author": "Autor" }
  ]
}`;
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 1).trimEnd();
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut}…`;
}

// CAMINO DE EMERGENCIA: se usa solo cuando la IA no entregó contenido
// válido (buildFallbackDeck). No es una reformulación pedagógica real —
// solo evita mostrar el texto curricular formal completo, con sus
// enumeraciones, tal cual en un bullet. El resultado esperado normal es
// que la IA reformule el contenido en lenguaje simple (ver
// buildSystemPrompt); esto es un mínimo aceptable, no un reemplazo.
function simplificarTextoCurricular(texto: string): string {
  const primeraClausula = texto.split(/(?<=[.;])\s+/)[0] || texto;
  return primeraClausula
    .replace(/,?\s*\b(incluyendo|considerando|tales como|entre otros?|entre otras?|así como)\b.*$/i, '')
    .replace(/[.,;]\s*$/, '')
    .trim();
}

function splitTextToBullets(text: string, maxItems: number): string[] {
  const trimmed = text.trim();
  if (!trimmed) return ['Sin contenido disponible', 'Consultar planificación para más detalles'];

  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 140);

  if (sentences.length === 0) return [trimmed.slice(0, 140), 'Detallar en clase'];
  if (sentences.length === 1) return [sentences[0], 'Ampliar durante la clase'];
  return sentences.slice(0, maxItems);
}

function buildFallbackDeck(plan: PedagogicalPlan): PptDeck {
  const oa = simplificarTextoCurricular(plan.objetivo_aprendizaje || plan.tema);
  const tema = plan.tema || 'el tema de la clase';
  const asignatura = plan.asignatura || 'la asignatura';
  const curso = plan.curso || 'el curso';

  const inicioDesc = plan.estructura_clase?.inicio?.descripcion || '';
  const desarrolloDesc = plan.estructura_clase?.desarrollo?.descripcion || '';
  const cierreDesc = plan.estructura_clase?.cierre?.descripcion || '';

  const indicadores = (plan.indicadores_seleccionados || []).join('; ');
  const criterios = (plan.criterios_seleccionados || []).join('; ');

  const slides: Slide[] = [
    {
      layout: 'title',
      title: truncate(`${tema} — ${asignatura}`, TITLE_MAX),
      subtitle: truncate([curso, asignatura].filter(Boolean).join(' | '), SUBTITLE_MAX),
    },
    {
      layout: 'bullets',
      title: 'Objetivo de Aprendizaje',
      bullets: [
        oa,
        ...(indicadores ? [indicadores] : []),
        `Asignatura: ${asignatura}`,
        `Curso: ${curso}`,
      ].slice(0, 6).map((b) => truncate(b, BULLET_MAX)),
    },
  ];

  if (inicioDesc) {
    slides.push({
      layout: 'bullets',
      title: 'Inicio de la Clase',
      bullets: splitTextToBullets(inicioDesc, 6),
    });
  }

  if (desarrolloDesc) {
    slides.push({
      layout: 'bullets',
      title: 'Desarrollo de la Clase',
      bullets: splitTextToBullets(desarrolloDesc, 6),
    });
  }

  if (cierreDesc) {
    slides.push({
      layout: 'bullets',
      title: 'Cierre de la Clase',
      bullets: splitTextToBullets(cierreDesc, 6),
    });
  }

  if (criterios) {
    slides.push({
      layout: 'bullets',
      title: 'Criterios de Evaluación',
      bullets: splitTextToBullets(criterios, 6),
    });
  }

  slides.push({
    layout: 'quote',
    text: `En ${asignatura}, cada estudiante puede demostrar su aprendizaje de múltiples formas.`,
    author: 'Diseño Universal para el Aprendizaje',
  });

  return { slides };
}

function isBulletsSlideValid(slide: Slide): boolean {
  if (slide.layout !== 'bullets') return true;
  return slide.bullets.length >= 2 && slide.bullets.every((b) => b.trim().length > 0);
}

function safeguardBulletsFromPlan(deck: PptDeck, plan: PedagogicalPlan): PptDeck {
  // CAMINO DE EMERGENCIA (ver simplificarTextoCurricular): solo se alcanza
  // si un slide de bullets queda con <2 items válidos después de la IA.
  const oa = simplificarTextoCurricular(plan.objetivo_aprendizaje || plan.tema);
  const indicadores = plan.indicadores_seleccionados || [];
  const criterios = plan.criterios_seleccionados || [];

  const fallbackBullets = [
    oa,
    ...indicadores,
    ...criterios,
  ].filter((s): s is string => s !== undefined && s.trim().length > 0 && s.trim().length <= 140);

  if (fallbackBullets.length < 2) {
    fallbackBullets.push(
      `OA: ${oa}`,
      `Asignatura: ${plan.asignatura}`,
      `Curso: ${plan.curso}`,
    );
  }

  const slides = deck.slides.map((slide) => {
    if (slide.layout === 'bullets' && !isBulletsSlideValid(slide)) {
      const validBullets = slide.bullets.filter((b) => b.trim().length > 0);
      const merged = [...validBullets, ...fallbackBullets];
      const unique = [...new Set(merged)].slice(0, 6);

      if (unique.length < 2) {
        unique.push(...fallbackBullets.slice(0, 2 - unique.length));
      }

      return { ...slide, bullets: unique };
    }
    return slide;
  });

  return { slides };
}

function safeguardEmptyArrays(deck: PptDeck): PptDeck {
  const slides = deck.slides.map((slide) => {
    if (slide.layout === 'comparison') {
      const leftPoints = slide.left.points.length > 0
        ? slide.left.points
        : [`${slide.left.label}: contenido no disponible`];
      const rightPoints = slide.right.points.length > 0
        ? slide.right.points
        : [`${slide.right.label}: contenido no disponible`];
      return {
        ...slide,
        left: { ...slide.left, points: leftPoints },
        right: { ...slide.right, points: rightPoints },
      };
    }
    return slide;
  });

  return { slides };
}

export async function generateDeckContent(
  env: AIEngineEnv,
  plan: PedagogicalPlan,
  opciones?: { maxSlides?: number },
): Promise<PptDeck> {
  const maxSlides = opciones?.maxSlides ?? 20;

  try {
    const { data } = await callAIConValidacion(
      env,
      buildSystemPrompt(plan),
      JSON.stringify(plan, null, 2),
      PptDeckSchema,
      { maxTokens: 3000 },
    );

    let deck = data;
    deck = safeguardBulletsFromPlan(deck, plan);
    deck = safeguardEmptyArrays(deck);
    deck.slides = deck.slides.slice(0, maxSlides);
    return deck;
  } catch (error) {
    console.error('[PptContentEngine] error:', error);
    return buildFallbackDeck(plan);
  }
}
