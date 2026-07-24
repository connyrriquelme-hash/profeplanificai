type ZipEntry = {
  name: string;
  content: Uint8Array;
};

const encoder = new TextEncoder();

export function sanitizeDownloadName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 90) || 'producto-profeplanificai';
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function paragraph(text: string, style = ''): string {
  const clean = text.trim();
  if (!clean) return '';
  const styleXml = style ? `<w:pPr>${style}</w:pPr>` : '';
  return `<w:p>${styleXml}<w:r><w:t xml:space="preserve">${escapeXml(clean)}</w:t></w:r></w:p>`;
}

function heading(text: string, level: 1 | 2 | 3): string {
  return paragraph(text, `<w:pStyle w:val="Heading${level}"/>`);
}

function tableFromElement(table: HTMLTableElement): string {
  const rows = Array.from(table.rows).map((row) => {
    const cells = Array.from(row.cells).map((cell) => {
      const text = cell.textContent?.replace(/\s+/g, ' ').trim() || '';
      return `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>${paragraph(text)}</w:tc>`;
    }).join('');
    return `<w:tr>${cells}</w:tr>`;
  }).join('');

  if (!rows) return '';

  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:left w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:right w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/></w:tblBorders></w:tblPr>${rows}</w:tbl>`;
}

function directText(element: Element): string {
  return Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent || '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function elementToWordXml(element: Element): string {
  const tag = element.tagName.toLowerCase();

  if (element.matches('[data-export-hidden="true"], .print\\:hidden')) return '';
  if (tag === 'table') return tableFromElement(element as HTMLTableElement);

  if (tag === 'h1') return heading(element.textContent || '', 1);
  if (tag === 'h2') return heading(element.textContent || '', 2);
  if (tag === 'h3' || tag === 'h4') return heading(element.textContent || '', 3);
  if (tag === 'li') return paragraph(`• ${element.textContent || ''}`);

  const text = directText(element);
  const ownParagraph = ['p', 'span', 'button'].includes(tag) ? paragraph(text) : '';
  const children = Array.from(element.children).map(elementToWordXml).join('');

  if (ownParagraph || children) return `${ownParagraph}${children}`;

  const fallback = element.textContent?.replace(/\s+/g, ' ').trim() || '';
  return ['section', 'article', 'aside'].includes(tag) ? paragraph(fallback) : '';
}

function buildDocumentXml(element: HTMLElement): string {
  const body = Array.from(element.children).map(elementToWordXml).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${heading('Producto pedagógico premium - ProfePlanificAI', 1)}
    ${body}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:color w:val="4C1D95"/><w:sz w:val="34"/></w:rPr><w:pPr><w:spacing w:after="160"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:rPr><w:b/><w:color w:val="6D28D9"/><w:sz w:val="28"/></w:rPr><w:pPr><w:spacing w:before="160" w:after="100"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:rPr><w:b/><w:color w:val="7C3AED"/><w:sz w:val="24"/></w:rPr><w:pPr><w:spacing w:before="120" w:after="80"/></w:pPr></w:style>
</w:styles>`;
}

function crc32(data: Uint8Array): number {
  let crc = -1;
  for (const byte of data) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const CRC_TABLE = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function writeUint16(buffer: number[], value: number): void {
  buffer.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(buffer: number[], value: number): void {
  buffer.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function createZip(entries: ZipEntry[]): Blob {
  const output: number[] = [];
  const centralDirectory: number[] = [];

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.content);
    const offset = output.length;

    writeUint32(output, 0x04034b50);
    writeUint16(output, 20);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint32(output, crc);
    writeUint32(output, entry.content.length);
    writeUint32(output, entry.content.length);
    writeUint16(output, name.length);
    writeUint16(output, 0);
    output.push(...name, ...entry.content);

    writeUint32(centralDirectory, 0x02014b50);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, crc);
    writeUint32(centralDirectory, entry.content.length);
    writeUint32(centralDirectory, entry.content.length);
    writeUint16(centralDirectory, name.length);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, 0);
    writeUint32(centralDirectory, offset);
    centralDirectory.push(...name);
  }

  const centralDirectoryOffset = output.length;
  output.push(...centralDirectory);

  writeUint32(output, 0x06054b50);
  writeUint16(output, 0);
  writeUint16(output, 0);
  writeUint16(output, entries.length);
  writeUint16(output, entries.length);
  writeUint32(output, centralDirectory.length);
  writeUint32(output, centralDirectoryOffset);
  writeUint16(output, 0);

  return new Blob([new Uint8Array(output)], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

function createDocxBlob(documentXml: string): Blob {
  return createZip([
    {
      name: '[Content_Types].xml',
      content: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`),
    },
    {
      name: '_rels/.rels',
      content: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`),
    },
    {
      name: 'word/_rels/document.xml.rels',
      content: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
    },
    { name: 'word/document.xml', content: encoder.encode(documentXml) },
    { name: 'word/styles.xml', content: encoder.encode(buildStylesXml()) },
  ]);
}

export function exportElementToWord(elementId: string, filename: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('No se encontró el producto para exportar.');
  }

  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-export-hidden="true"], .print\\:hidden').forEach((node) => node.remove());

  const blob = createDocxBlob(buildDocumentXml(clone));
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeDownloadName(filename)}.docx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
