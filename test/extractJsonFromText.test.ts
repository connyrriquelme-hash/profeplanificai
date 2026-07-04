import { describe, it, expect, vi } from 'vitest';
import { extractJsonFromText } from '../functions/core/AIEngine';

describe('extractJsonFromText', () => {
  it('should extract JSON from plain text', () => {
    const result = extractJsonFromText('Here is the result: {"foo":"bar"} done.');
    expect(result).toBe('{"foo":"bar"}');
  });

  it('should extract JSON from markdown code block', () => {
    const result = extractJsonFromText('```json\n{"foo":"bar"}\n```');
    expect(result).toBe('{"foo":"bar"}');
  });

  it('should handle empty input', () => {
    expect(extractJsonFromText('')).toBe('');
    expect(extractJsonFromText(null as unknown as string)).toBe('');
  });

  it('should handle nested JSON', () => {
    const result = extractJsonFromText('prefix {"a":{"b":1}} suffix');
    expect(result).toBe('{"a":{"b":1}}');
  });

  it('should handle text before and after JSON', () => {
    const result = extractJsonFromText('Here is the output:\n{"key":"value"}\nDone.');
    expect(result).toBe('{"key":"value"}');
  });

  it('should handle multiple JSON-like structures by taking the last closing brace', () => {
    const result = extractJsonFromText('{"a":1} and {"b":2}');
    expect(result).toBe('{"a":1} and {"b":2}');
  });

  it('should handle no JSON at all', () => {
    const result = extractJsonFromText('Just plain text with no JSON.');
    expect(result).toBe('Just plain text with no JSON.');
  });

  it('should handle markdown block without json tag', () => {
    const result = extractJsonFromText('```\n{"foo":"bar"}\n```');
    expect(result).toBe('{"foo":"bar"}');
  });
});
