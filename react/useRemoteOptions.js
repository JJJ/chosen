import { useCallback, useEffect, useRef, useState } from 'react';
import { createRemoteSource } from '../remote/index.mjs';

export function useRemoteOptions({ load, value = [], selectedOptions = [], minLength = 2, limit = 50, onStatus } = {}) {
  const [page, setPage] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);
  const loader = useRef(load);
  const statusHandler = useRef(onStatus);
  const selectedCache = useRef(new Map());
  const controllerRef = useRef(null);
  const lastQuery = useRef(null);
  loader.current = load;
  statusHandler.current = onStatus;

  useEffect(() => {
    const controller = createRemoteSource((query, request) => loader.current(query, request), {
      minLength, limit, onResults: records => setPage(records),
      onStatus: (nextStatus, query, failure, count) => {
        setStatus(nextStatus);
        setError(failure ?? null);
        setCount(nextStatus === 'ready' ? count : 0);
        statusHandler.current?.(nextStatus, query, failure, count);
      }
    });
    controllerRef.current = controller;
    if (lastQuery.current != null) controller.search(lastQuery.current);
    return () => {
      controllerRef.current = null;
      controller.dispose();
    };
  }, [minLength, limit]);

  const values = (Array.isArray(value) ? value : [value]).filter(item => item != null && item !== '').map(String);
  const selected = new Set(values);
  for (const key of selectedCache.current.keys()) if (!selected.has(key)) selectedCache.current.delete(key);
  for (const record of selectedOptions) {
    const key = String(record.value);
    if (!selectedCache.current.has(key)) selectedCache.current.set(key, record);
  }
  for (const record of page) if (selected.has(record.value)) {
    selectedCache.current.set(record.value, { ...selectedCache.current.get(record.value), ...record });
  }
  const options = [
    ...values.map(item => selectedCache.current.get(item)).filter(Boolean),
    ...page.filter(item => !selected.has(item.value))
  ];

  return {
    options, status, error, count,
    search: useCallback(query => {
      lastQuery.current = String(query ?? '');
      controllerRef.current?.search(lastQuery.current);
    }, []),
    refresh: useCallback(() => controllerRef.current?.refresh(), [])
  };
}
