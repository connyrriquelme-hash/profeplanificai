interface SelectorOAProps {
  onSelect: (oa: string) => void;
}

const OAS = [
  'OA 01: Leer de manera fluida textos variados apropiados a su edad.',
  'OA 02: Escribir textos narrativos, descriptivos y expositivos breves.',
  'OA 03: Comprender textos narrativos identificando secuencia narrativa.',
  'OA 04: Analizar y evaluar textos de los medios de comunicación.',
  'OA 05: Reconocer la diversidad cultural de los pueblos originarios de Chile.',
];

export function SelectorOA({ onSelect }: SelectorOAProps) {
  return (
    <select
      onChange={e => onSelect(e.target.value)}
      defaultValue=""
      style={{ width: '100%', padding: '8px 12px' }}
    >
      <option value="" disabled>Seleccionar OA...</option>
      {OAS.map(oa => (
        <option key={oa} value={oa}>{oa}</option>
      ))}
    </select>
  );
}
