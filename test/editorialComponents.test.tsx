/**
 * Editorial Components Tests
 *
 * Validates rendering, accessibility, empty states, and structural integrity
 * of all 12 editorial components.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { EditorialHeader } from '../src/components/products/editorial/EditorialHeader';
import { CurriculumCallout } from '../src/components/products/editorial/CurriculumCallout';
import { StudentInfoFields } from '../src/components/products/editorial/StudentInfoFields';
import { TeacherInfoFields } from '../src/components/products/editorial/TeacherInfoFields';
import { EditorialFooter } from '../src/components/products/editorial/EditorialFooter';
import { InstructionCallout } from '../src/components/products/editorial/InstructionCallout';
import { PedagogicalBlock } from '../src/components/products/editorial/PedagogicalBlock';
import { ResponseArea } from '../src/components/products/editorial/ResponseArea';
import { ExampleBox } from '../src/components/products/editorial/ExampleBox';
import { ChallengeBox } from '../src/components/products/editorial/ChallengeBox';
import { ReflectionBox } from '../src/components/products/editorial/ReflectionBox';
import { VocabularyBox } from '../src/components/products/editorial/VocabularyBox';

describe('EditorialHeader', () => {
  it('renders title', () => {
    render(<EditorialHeader title="Mi Guía" />);
    expect(screen.getByText('Mi Guía')).toBeDefined();
  });

  it('renders subtitle when provided', () => {
    render(<EditorialHeader title="T" subtitle="Sub" />);
    expect(screen.getByText('Sub')).toBeDefined();
  });

  it('renders platform name with default', () => {
    render(<EditorialHeader title="T" />);
    expect(screen.getByText('PlanificaIA Chile')).toBeDefined();
  });

  it('renders custom platform name', () => {
    render(<EditorialHeader title="T" platformName="ProfeIA" />);
    expect(screen.getByText('ProfeIA')).toBeDefined();
  });

  it('renders OA code and text', () => {
    render(<EditorialHeader title="T" oaCode="OA1" oaText="Objetivo" />);
    expect(screen.getByText('OA1')).toBeDefined();
    expect(screen.getByText('Objetivo')).toBeDefined();
  });

  it('renders estimated time', () => {
    render(<EditorialHeader title="T" estimatedTime={45} />);
    expect(screen.getByText('45 min')).toBeDefined();
  });

  it('renders version and page number', () => {
    render(<EditorialHeader title="T" version="1.0" pageNumber={3} />);
    expect(screen.getByText('v1.0')).toBeDefined();
    expect(screen.getByText('Página 3')).toBeDefined();
  });

  it('renders establishment and teacher', () => {
    render(<EditorialHeader title="T" establishmentName="Liceo" teacherName="Prof. Juan" />);
    expect(screen.getByText('Liceo')).toBeDefined();
    expect(screen.getByText('Prof. Juan')).toBeDefined();
  });

  it('accepts custom className', () => {
    const { container } = render(<EditorialHeader title="T" className="custom" />);
    expect(container.firstChild).toBeDefined();
  });

  it('has accessible header element', () => {
    render(<EditorialHeader title="T" />);
    const header = screen.getByRole('banner', { hidden: true });
    expect(header).toBeDefined();
  });
});

describe('CurriculumCallout', () => {
  it('renders nothing when empty', () => {
    const { container } = render(<CurriculumCallout />);
    expect(container.innerHTML).toBe('');
  });

  it('renders OA code and text', () => {
    render(<CurriculumCallout oaCode="OA2" oaText="Describir" />);
    expect(screen.getByText('OA2')).toBeDefined();
    expect(screen.getByText('Describir')).toBeDefined();
  });

  it('renders skills list', () => {
    render(<CurriculumCallout skills={['Observar', 'Medir']} />);
    expect(screen.getByText('Observar')).toBeDefined();
    expect(screen.getByText('Medir')).toBeDefined();
  });

  it('renders learning goal', () => {
    render(<CurriculumCallout learningGoal="Meta de aprendizaje" />);
    expect(screen.getByText('Meta de aprendizaje')).toBeDefined();
  });

  it('has complementary role', () => {
    render(<CurriculumCallout oaCode="OA1" />);
    expect(screen.getByRole('complementary')).toBeDefined();
  });
});

describe('StudentInfoFields', () => {
  it('renders with empty data showing dashes', () => {
    render(<StudentInfoFields />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders student name when provided', () => {
    render(<StudentInfoFields studentName="María" />);
    expect(screen.getByText('María')).toBeDefined();
  });

  it('renders course when provided', () => {
    render(<StudentInfoFields course="4° Básico" />);
    expect(screen.getByText('4° Básico')).toBeDefined();
  });

  it('renders signature lines when showSignature is true', () => {
    render(<StudentInfoFields showSignature />);
    expect(screen.getByText('Firma del estudiante')).toBeDefined();
    expect(screen.getByText('Firma del docente')).toBeDefined();
  });

  it('renders editable inputs when editable is true', () => {
    render(<StudentInfoFields editable />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });
});

describe('TeacherInfoFields', () => {
  it('renders with empty data showing dashes', () => {
    render(<TeacherInfoFields />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders teacher name when provided', () => {
    render(<TeacherInfoFields teacherName="Prof. Ana" />);
    expect(screen.getByText('Prof. Ana')).toBeDefined();
  });

  it('renders establishment when provided', () => {
    render(<TeacherInfoFields establishmentName="Escuela" />);
    expect(screen.getByText('Escuela')).toBeDefined();
  });

  it('renders editable inputs when editable is true', () => {
    render(<TeacherInfoFields editable />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });
});

describe('EditorialFooter', () => {
  it('renders default platform name', () => {
    render(<EditorialFooter />);
    expect(screen.getByText('PlanificaIA Chile')).toBeDefined();
  });

  it('renders custom platform name', () => {
    render(<EditorialFooter platformName="ProfeIA" />);
    expect(screen.getByText('ProfeIA')).toBeDefined();
  });

  it('renders version when provided', () => {
    render(<EditorialFooter version="2.0" />);
    expect(screen.getByText('v2.0')).toBeDefined();
  });

  it('renders page number when provided', () => {
    render(<EditorialFooter pageNumber={1} totalPages={5} />);
    expect(screen.getByText('Página 1 de 5')).toBeDefined();
  });

  it('renders page number without total', () => {
    render(<EditorialFooter pageNumber={3} />);
    expect(screen.getByText('Página 3')).toBeDefined();
  });

  it('has contentinfo role', () => {
    render(<EditorialFooter />);
    expect(screen.getByRole('contentinfo')).toBeDefined();
  });
});

describe('InstructionCallout', () => {
  it('renders instruction text', () => {
    render(<InstructionCallout instruction="Lee atentamente" />);
    expect(screen.getByText('Lee atentamente')).toBeDefined();
  });

  it('renders title when provided', () => {
    render(<InstructionCallout instruction="Instrucción" title="Importante" />);
    expect(screen.getByText('Importante')).toBeDefined();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<InstructionCallout instruction="Test" variant="warning" />);
    expect(screen.getByText('Test')).toBeDefined();
    rerender(<InstructionCallout instruction="Test" variant="tip" />);
    expect(screen.getByText('Test')).toBeDefined();
    rerender(<InstructionCallout instruction="Test" variant="important" />);
    expect(screen.getByText('Test')).toBeDefined();
  });

  it('has note role', () => {
    render(<InstructionCallout instruction="Test" />);
    expect(screen.getByRole('note')).toBeDefined();
  });
});

describe('PedagogicalBlock', () => {
  it('renders children', () => {
    render(<PedagogicalBlock><p>Content</p></PedagogicalBlock>);
    expect(screen.getByText('Content')).toBeDefined();
  });

  it('renders title when provided', () => {
    render(<PedagogicalBlock title="Sección"><p>Content</p></PedagogicalBlock>);
    expect(screen.getByText('Sección')).toBeDefined();
  });

  it('renders number when provided', () => {
    render(<PedagogicalBlock number={1}><p>Content</p></PedagogicalBlock>);
    expect(screen.getByText('1')).toBeDefined();
  });

  it('renders different variants', () => {
    const { rerender } = render(<PedagogicalBlock variant="highlighted"><p>A</p></PedagogicalBlock>);
    expect(screen.getByText('A')).toBeDefined();
    rerender(<PedagogicalBlock variant="muted"><p>B</p></PedagogicalBlock>);
    expect(screen.getByText('B')).toBeDefined();
  });
});

describe('ResponseArea', () => {
  it('renders lines variant by default', () => {
    render(<ResponseArea />);
    const group = screen.getByRole('group');
    expect(group).toBeDefined();
  });

  it('renders label when provided', () => {
    render(<ResponseArea label="Respuesta" />);
    expect(screen.getByText('Respuesta')).toBeDefined();
  });

  it('renders instruction when provided', () => {
    render(<ResponseArea instruction="Escribe aquí" />);
    expect(screen.getByText('Escribe aquí')).toBeDefined();
  });

  it('renders textarea variant', () => {
    render(<ResponseArea variant="textarea" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDefined();
  });

  it('renders boxed variant', () => {
    render(<ResponseArea variant="boxed" />);
    const group = screen.getByRole('group');
    expect(group).toBeDefined();
  });

  it('renders correct number of lines', () => {
    const { container } = render(<ResponseArea lines={6} />);
    const lineDividers = container.querySelectorAll('.border-b');
    expect(lineDividers.length).toBe(6);
  });
});

describe('ExampleBox', () => {
  it('renders example text', () => {
    render(<ExampleBox exampleText="2 + 2 = 4" />);
    expect(screen.getByText('2 + 2 = 4')).toBeDefined();
  });

  it('renders default title', () => {
    render(<ExampleBox exampleText="Test" />);
    expect(screen.getByText('Ejemplo')).toBeDefined();
  });

  it('renders custom title', () => {
    render(<ExampleBox title="Mi Ejemplo" exampleText="Test" />);
    expect(screen.getByText('Mi Ejemplo')).toBeDefined();
  });

  it('renders steps when provided', () => {
    render(
      <ExampleBox
        steps={[
          { label: 'Paso 1', content: 'Primero' },
          { content: 'Segundo' },
        ]}
      />
    );
    expect(screen.getByText('Paso 1')).toBeDefined();
    expect(screen.getByText('Primero')).toBeDefined();
    expect(screen.getByText('Segundo')).toBeDefined();
  });

  it('renders different variants', () => {
    const { rerender } = render(<ExampleBox variant="worked" exampleText="A" />);
    expect(screen.getByText('Ejemplo resuelto')).toBeDefined();
    rerender(<ExampleBox variant="guided" exampleText="B" />);
    expect(screen.getByText('Ejemplo guiado')).toBeDefined();
  });
});

describe('ChallengeBox', () => {
  it('renders challenge text', () => {
    render(<ChallengeBox challenge="Resuelve esto" />);
    expect(screen.getByText('Resuelve esto')).toBeDefined();
  });

  it('renders default title', () => {
    render(<ChallengeBox challenge="Test" />);
    expect(screen.getByText('Desafío')).toBeDefined();
  });

  it('renders custom title', () => {
    render(<ChallengeBox title="Mi Desafío" challenge="Test" />);
    expect(screen.getByText('Mi Desafío')).toBeDefined();
  });

  it('renders hints in details element', () => {
    render(<ChallengeBox challenge="Test" hints={['Pista 1', 'Pista 2']} />);
    expect(screen.getByText(/Pistas/)).toBeDefined();
  });

  it('has article role', () => {
    render(<ChallengeBox challenge="Test" />);
    expect(screen.getByRole('article')).toBeDefined();
  });
});

describe('ReflectionBox', () => {
  it('renders nothing when no content', () => {
    const { container } = render(<ReflectionBox />);
    expect(container.innerHTML).toBe('');
  });

  it('renders prompt text', () => {
    render(<ReflectionBox prompt="¿Qué aprendiste?" />);
    expect(screen.getByText('¿Qué aprendiste?')).toBeDefined();
  });

  it('renders custom title', () => {
    render(<ReflectionBox title="Mi Reflexión" prompt="Test" />);
    expect(screen.getByText('Mi Reflexión')).toBeDefined();
  });

  it('renders multiple prompts', () => {
    render(
      <ReflectionBox
        prompts={[
          { question: 'Pregunta 1' },
          { question: 'Pregunta 2', lines: 5 },
        ]}
      />
    );
    expect(screen.getByText('Pregunta 1')).toBeDefined();
    expect(screen.getByText('Pregunta 2')).toBeDefined();
  });

  it('has article role', () => {
    render(<ReflectionBox prompt="Test" />);
    expect(screen.getByRole('article')).toBeDefined();
  });
});

describe('VocabularyBox', () => {
  it('renders nothing when no terms', () => {
    const { container } = render(<VocabularyBox />);
    expect(container.innerHTML).toBe('');
  });

  it('renders terms with definitions', () => {
    render(
      <VocabularyBox terms={[{ term: 'Fotosíntesis', definition: 'Proceso vital' }]} />
    );
    expect(screen.getByText('Fotosíntesis')).toBeDefined();
    expect(screen.getByText('Proceso vital')).toBeDefined();
  });

  it('renders simple terms', () => {
    render(<VocabularyBox simpleTerms={['Ecosistema', 'Bioma']} />);
    expect(screen.getByText('Ecosistema')).toBeDefined();
    expect(screen.getByText('Bioma')).toBeDefined();
  });

  it('renders default title', () => {
    render(<VocabularyBox simpleTerms={['Test']} />);
    expect(screen.getByText('Vocabulario clave')).toBeDefined();
  });

  it('renders custom title', () => {
    render(<VocabularyBox title="Mis Términos" simpleTerms={['Test']} />);
    expect(screen.getByText('Mis Términos')).toBeDefined();
  });

  it('has complementary role', () => {
    render(<VocabularyBox simpleTerms={['Test']} />);
    expect(screen.getByRole('complementary')).toBeDefined();
  });
});
