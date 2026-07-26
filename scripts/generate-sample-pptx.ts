import { buildRenderableDeck } from '../functions/core/PptLayoutEngine';
import { renderPptx } from '../functions/core/PptRenderer';
import { defaultTheme } from '../schemas/PptThemeSchema';
import type { PptDeck } from '../schemas/PptDeckSchema';
import fs from 'fs';

const deck: PptDeck = {
  slides: [
    { layout: 'title', title: 'La Célula', subtitle: '5° Básico — Ciencias Naturales' },
    {
      layout: 'bullets',
      title: 'Objetivo de Aprendizaje',
      bullets: [
        'Describir la estructura celular y sus partes',
        'Identificar organelos: membrana, citoplasma, núcleo',
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

// renderPptx now returns a Uint8Array buffer (Cloudflare Workers compatible).
// This script runs in Node for local development only — writing to disk here
// is for manual inspection, NOT part of the production pipeline.
const buffer = await renderPptx(renderables);
const outputPath = 'tmp/ejemplo-la-celula.pptx';

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync(outputPath, buffer);

// Verify it's a valid ZIP (.pptx)
const magicBytes = buffer.slice(0, 2);
const isZip = magicBytes[0] === 0x50 && magicBytes[1] === 0x4b;
console.log('Generado:', outputPath);
console.log('Tamaño:', buffer.length, 'bytes');
console.log('Firma ZIP válida:', isZip);
