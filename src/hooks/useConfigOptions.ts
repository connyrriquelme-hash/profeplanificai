import { useState, useEffect, useCallback, useRef } from 'react';

export interface ConfigOption {
  id: string;
  value: string;
  label: string;
  metadata?: Record<string, any>;
}

export type ConfigCategory =
  | 'methodologies'
  | 'evaluation_types'
  | 'resource_types'
  | 'durations'
  | 'approaches'
  | 'difficulty_levels'
  | 'cognitive_skills'
  | 'non_teaching_types'
  | 'priorities'
  | 'publication_types'
  | 'support_levels'
  | 'support_focus'
  | 'support_formats'
  | 'class_types'
  | 'resource_styles'
  | 'output_formats'
  | 'plan_tones'
  | 'weekdays'
  | 'block_types'
  | 'ai_providers';

export interface UseConfigOptionsReturn {
  getOptions: (category: ConfigCategory) => ConfigOption[];
  getValueLabel: (category: ConfigCategory, value: string) => string;
  loading: boolean;
  error: string;
  allOptions: Record<string, ConfigOption[]>;
}

const CACHE_KEY = 'app_config_cache';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  data: Record<string, ConfigOption[]>;
  timestamp: number;
}

function readCache(): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
    return entry;
  } catch { return null; }
}

function writeCache(data: Record<string, ConfigOption[]>): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

type Subscriber = (data: Record<string, ConfigOption[]>, err: string) => void;

let _globalData: Record<string, ConfigOption[]> | null = null;
let _globalTimestamp = 0;
let _globalPromise: Promise<Record<string, ConfigOption[]>> | null = null;
let _subscribers: Set<Subscriber> = new Set();

function isCacheValid(): boolean {
  return _globalData !== null && (Date.now() - _globalTimestamp) < CACHE_TTL_MS;
}

function notifySubscribers(data: Record<string, ConfigOption[]>, err: string) {
  for (const sub of _subscribers) {
    try { sub(data, err); } catch {}
  }
}

function startFetch() {
  if (_globalPromise) return _globalPromise;

  _globalPromise = (async () => {
    try {
      const res = await fetch('/api/config/options');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data: Record<string, ConfigOption[]> = json.data || {};
      _globalData = data;
      _globalTimestamp = Date.now();
      writeCache(data);
      notifySubscribers(data, '');
      return data;
    } catch (e) {
      _globalPromise = null;
      const msg = e instanceof Error ? e.message : 'Error loading config';
      notifySubscribers({}, msg);
      return {};
    }
  })();

  return _globalPromise;
}

export function useConfigOptions(): UseConfigOptionsReturn {
  const [allOptions, setAllOptions] = useState<Record<string, ConfigOption[]>>(() => {
    const cached = readCache();
    return cached?.data || {};
  });
  const [loading, setLoading] = useState(() => {
    const cached = readCache();
    return !(cached?.data && Object.keys(cached.data).length > 0);
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const cached = readCache();
    if (cached?.data && Object.keys(cached.data).length > 0) {
      _globalData = cached.data;
      _globalTimestamp = cached.timestamp;
      setAllOptions(cached.data);
      setLoading(false);
    } else if (isCacheValid() && _globalData) {
      setAllOptions(_globalData);
      setLoading(false);
    } else {
      startFetch();
    }

    const subscriber: Subscriber = (data, err) => {
      setAllOptions(data);
      setError(err);
      setLoading(false);
    };
    _subscribers.add(subscriber);

    return () => { _subscribers.delete(subscriber); };
  }, []);

  const getOptions = useCallback((category: ConfigCategory): ConfigOption[] => {
    return allOptions[category] || [];
  }, [allOptions]);

  const getValueLabel = useCallback((category: ConfigCategory, value: string): string => {
    const opts = allOptions[category] || [];
    const found = opts.find(o => o.value === value);
    return found?.label || value;
  }, [allOptions]);

  return { getOptions, getValueLabel, loading, error, allOptions };
}

export function resetConfigCache(): void {
  _globalData = null;
  _globalTimestamp = 0;
  _globalPromise = null;
  try { sessionStorage.removeItem(CACHE_KEY); } catch {}
}
