import { describe, it, expect } from 'vitest';
import { htmlEscape, mdToHtml } from '../utils/htmlUtils';

describe('htmlEscape', () => {
  it('escapes & < > characters', () => {
    expect(htmlEscape('a & b < c > d')).toBe('a &amp; b &lt; c &gt; d');
  });

  it('returns empty string for falsy input', () => {
    expect(htmlEscape('')).toBe('');
  });

  it('passes through normal text', () => {
    expect(htmlEscape('Hola mundo')).toBe('Hola mundo');
  });
});

describe('mdToHtml', () => {
  it('converts # heading to h1', () => {
    expect(mdToHtml('# Título')).toContain('<h1>Título</h1>');
  });

  it('converts ## heading to h2', () => {
    expect(mdToHtml('## Subtítulo')).toContain('<h2>Subtítulo</h2>');
  });

  it('converts ### heading to h3', () => {
    expect(mdToHtml('### Sección')).toContain('<h3>Sección</h3>');
  });

  it('converts **bold** to <b>', () => {
    expect(mdToHtml('texto **importante** aquí')).toContain('<b>importante</b>');
  });

  it('converts - list items to <li>', () => {
    const result = mdToHtml('- item 1\n- item 2');
    expect(result).toContain('<li>item 1</li>');
    expect(result).toContain('<li>item 2</li>');
  });

  it('wraps list items in <ul>', () => {
    const result = mdToHtml('- a\n- b');
    expect(result).toContain('<ul>');
    expect(result).toContain('</ul>');
  });

  it('escapes HTML in input', () => {
    const result = mdToHtml('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
});
