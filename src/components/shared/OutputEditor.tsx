import { mdToHtml } from '../../utils/htmlUtils';

interface OutputEditorProps {
  contenido: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

export function OutputEditor({ contenido, onChange, placeholder = '' }: OutputEditorProps) {
  const html = mdToHtml(contenido);

  if (!contenido && placeholder) {
    return <p className="muted" style={{ padding: '12px 0' }}>{placeholder}</p>;
  }

  return (
    <div
      className="output output-light"
      contentEditable
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{ __html: html }}
      onBlur={(e) => onChange?.(e.currentTarget.innerHTML)}
    />
  );
}
