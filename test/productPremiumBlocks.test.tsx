import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PremiumTable } from '../src/components/products/ProductPremiumBlocks';

describe('ProductPremiumBlocks', () => {
  it('renders table headers provided as headers for legacy premium products', () => {
    render(
      <PremiumTable
        table={{
          title: 'Ajustes por necesidad',
          headers: ['Necesidad', 'Ajuste', 'Evidencia'],
          rows: [['Déficit atencional', 'Instrucciones de un paso', 'Completa dos etiquetas']],
        }}
      />,
    );

    expect(screen.getByText('Ajustes por necesidad')).toBeInTheDocument();
    expect(screen.getByText('Necesidad')).toBeInTheDocument();
    expect(screen.getByText('Déficit atencional')).toBeInTheDocument();
  });
});
