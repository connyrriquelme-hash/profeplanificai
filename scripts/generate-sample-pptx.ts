import { buildRenderableDeck } from '../functions/core/PptLayoutEngine';
import { renderPptx } from '../functions/core/PptRenderer';
import { defaultTheme } from '../schemas/PptThemeSchema';
import type { PptDeck } from '../schemas/PptDeckSchema';

const deck: PptDeck = {
  slides: [
    { layout: 'title', title: 'La Célula', subtitle: '5° Básico — Ciencias Naturales' },
    {
      layout: 'bullets',
      title: 'Objetivo de Aprendizaje',
      bullets: [
        'Describir la estructura celular y sus partes',
        'Identificar orgánulos: membrana, citoplasma, núcleo',
        'Comparar célula vegetal y animal',
        'Relacionar estructura con función',
      ],
    },
    {
      layout: 'image_text',
      title: 'Estructura Celular',
      body: 'La célula es la unidad básica de la vida. Todas las partes trabajan juntas para mantener la célula viva y funcionando correctamente.',
      imageQuery: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Epidermis_en.svg/200px-Epidermis_en.svg.png',
    },
    {
      layout: 'comparison',
      title: 'Vegetal vs Animal',
      left: {
        label: 'Célula Vegetal',
        points: ['Pared celular de celulosa', 'Cloroplastos para fotosíntesis', 'Vacuola central grande'],
      },
      right: {
        label: 'Célula Animal',
        points: ['Sin pared celular', 'Centriolos para división', 'Vacuolas pequeñas y múltiples'],
      },
    },
    { layout: 'quote', text: 'La vida es un fenómeno emergente de la complejidad molecular.', author: 'Francisco Varela' },
  ],
};

const renderables = buildRenderableDeck(deck, defaultTheme);
const out = await renderPptx(renderables, 'tmp/ejemplo-la-celula.pptx');
console.log('Generado:', out);
