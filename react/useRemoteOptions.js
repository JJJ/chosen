import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRemoteSource } from '../remote/index.mjs';

export function useRemoteOptions({ load, value = [], selectedOptions = [], minLength = 2, limit = 50, onStatus } = {}) {
  const [page, setPage] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);
  const loader = useRef(load);
  const statusHandler = useRef(onStatus);
  const selectedCache = useRef(new Map());
  loader.current = load;
  statusHandler.current = onStatus;

  const controller = useMemo(() => createRemoteSource(
    (query, request) => loader.current(query, request),
    {
      minLength, limit, onResults: records => setPage(records),
      onStatus: (nextStatus, query, failure, count) => {
        setStatus(nextStatus);
        setError(failure ?? null);
        setCount(nextStatus === 'ready' ? count : 0);
        statusHandler.current?.(nextStatus, query, failure, count);
      }
    }
  ), [minLength, limit]);
  useEffect(() => () => controller.dispose(), [controller]);

  const values = (Array.isArray(value) ? value : [value]).filter(item => item != null && item !== '').map(String);
  const selected = new Set(values);
  for (const key of selectedCache.current.keys()) if (!selected.has(key)) selectedCache.current.delete(key);
  for (const record of selectedOptions) selectedCache.current.set(String(record.value), record);
  for (const record of page) if (selected.has(record.value)) selectedCache.current.set(record.value, record);
  const options = [
    ...values.map(item => selectedCache.current.get(item)).filter(Boolean),
    ...page.filter(item => !selected.has(item.value))
  ];

  return {
    options, status, error, count,
    search: useCallback(query => controller.search(query), [controller]),
    refresh: useCallback(() => controller.refresh(), [controller])
  };
}
