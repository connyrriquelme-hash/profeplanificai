import { useState, useCallback } from 'react';

interface Resource {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  level: string;
  content: string;
  created_at: string;
}

interface ResourceInput {
  title: string;
  subject: string;
  level: string;
  content: string;
  user_id: string;
}

const API_URL = '/api/resources';

export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Error al obtener recursos');
      const data = await response.json();
      setResources(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveResource = useCallback(async (data: ResourceInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al guardar recurso');
      const result = await response.json();
      if (result.data) {
        setResources((prev) => [result.data, ...prev]);
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { resources, isLoading, error, fetchResources, saveResource };
}