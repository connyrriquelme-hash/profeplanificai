import { z } from 'zod';

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const HexColorSchema = z.string().regex(HEX_COLOR_REGEX, 'Color debe ser hex válido (#RRGGBB)');

const ColoresSchema = z.object({
  primario: HexColorSchema,
  secundario: HexColorSchema,
  texto: HexColorSchema,
  textoSobreFondoOscuro: HexColorSchema,
  fondo: HexColorSchema,
  acento: HexColorSchema,
});

const TipografiaSchema = z.object({
  titulo: z.string().min(1),
  cuerpo: z.string().min(1),
});

const ReglasDUASchema = z.object({
  contrasteMinimo: z.number().min(1).max(21).default(4.5),
  tamanoFuenteMinimoPt: z.number().min(8).max(72).default(18),
});

export const PptThemeSchema = z.object({
  institucionId: z.string().min(1),
  colores: ColoresSchema,
  tipografia: TipografiaSchema,
  logoUrl: z.string().url().optional(),
  reglasDUA: ReglasDUASchema,
});

export type PptTheme = z.infer<typeof PptThemeSchema>;
export type Colores = z.infer<typeof ColoresSchema>;
export type Tipografia = z.infer<typeof TipografiaSchema>;
export type ReglasDUA = z.infer<typeof ReglasDUASchema>;

export const defaultTheme: PptTheme = {
  institucionId: 'default',
  colores: {
    primario: '#1E3A5F',
    secundario: '#4A90D9',
    texto: '#1A1A1A',
    textoSobreFondoOscuro: '#FFFFFF',
    fondo: '#FFFFFF',
    acento: '#E8740C',
  },
  tipografia: {
    titulo: 'Arial',
    cuerpo: 'Arial',
  },
  reglasDUA: {
    contrasteMinimo: 4.5,
    tamanoFuenteMinimoPt: 18,
  },
};
