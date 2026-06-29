import { useState, useCallback } from 'react';
import { api } from '../services/apiClient';

export interface Resource {
  id: string;
  user_id: string;
  title: string;
  type: string;
  source: string;
  content: string;
  level: string;
  subject: string;
  objective_code: string;
  objective_text: string;
  skill: string;
  metadata_json: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceInput {
  title: string;
  type?: string;
  source?: string;
  content: string;
  level?: string;
  subject?: string;
  objectiveCode?: string;
  objectiveText?: string;
  skill?: string;
  metadata?: Record<string, string>;
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
      const data = await api.get<{ data: Resource[] }>(API_URL);
      setResources(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveResource = useCallback(async (input: ResourceInput): Promise<Resource | undefined> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.post<{ data: Resource }>(API_URL, input);
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
