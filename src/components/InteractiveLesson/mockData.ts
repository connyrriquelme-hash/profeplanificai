import type { Slide } from './InteractiveLesson.types';

export const mockSlides: Slide[] = [
  {
    type: 'title',
    title: 'Los Animales',
    subtitle: '¿Qué tienen en común los seres vivos del planeta?',
  },
  {
    type: 'bullets',
    title: 'Características de los Animales',
    items: [
      'Se desplazan de un lugar a otro',
      'Necesitan alimento para sobrevivir',
      'Se reproducen y tienen crías',
      'Crecen y se desarrollan con el tiempo',
    ],
  },
  {
    type: 'comparison',
    title: 'Mamíferos vs Aves',
    element1: {
      name: 'Mamíferos',
      characteristics: [
        'Tienen pelo o pelaje',
        'Amamantan a sus crías',
        'Son de sangre caliente',
      ],
    },
    element2: {
      name: 'Aves',
      characteristics: [
        'Tienen plumas',
        'Ponen huevos',
        'Tienen pico y alas',
      ],
    },
  },
  {
    type: 'imageText',
    title: 'El Pez Payaso',
    content: 'Vive en el océano, tiene rayas naranjas y blancas, y se esconde entre las anémonas para protegerse de sus depredadores.',
    imagePrompt: 'A colorful clownfish swimming among sea anemones in a tropical coral reef, children illustration style',
  },
  {
    type: 'quiz',
    title: '¿Qué característica tienen TODOS los animales?',
    options: [
      'Tienen alas',
      'Se desplazan y necesitan alimento',
      'Viven en el agua',
      'Son de color verde',
    ],
    correctIndex: 1,
    feedback: 'Todos los animales se desplazan y necesitan alimento para sobrevivir, aunque lo hagan de formas muy diferentes.',
  },
  {
    type: 'closing',
    title: '¡Excelente trabajo! 🎉',
    reflectionPrompt: 'Piensa en un animal que hayas visto cerca de tu casa. ¿Qué características tiene? Compártelo con tu compañero.',
  },
];
