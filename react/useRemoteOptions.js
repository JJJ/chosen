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
  const selectedInputs = useRef(new Map());
  const remoteLabels = useRef(new Map());
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
  const nextSelectedCache = new Map(selectedCache.current);
  const nextSelectedInputs = new Map(selectedInputs.current);
  const nextRemoteLabels = new Map(remoteLabels.current);
  for (const key of nextSelectedCache.keys()) if (!selected.has(key)) {
    nextSelectedCache.delete(key);
    nextSelectedInputs.delete(key);
    nextRemoteLabels.delete(key);
  }
  for (const record of selectedOptions) {
    const key = String(record.value);
    if (nextSelectedInputs.get(key) !== record) {
      const remoteLabel = nextRemoteLabels.get(key);
      nextSelectedCache.set(key, remoteLabel == null ? record : { ...record, label: remoteLabel });
      nextSelectedInputs.set(key, record);
    }
  }
  for (const record of page) if (selected.has(record.value)) {
    nextSelectedCache.set(record.value, { ...nextSelectedCache.get(record.value), ...record });
    nextRemoteLabels.set(record.value, record.label);
  }
  useEffect(() => {
    selectedCache.current = nextSelectedCache;
    selectedInputs.current = nextSelectedInputs;
    remoteLabels.current = nextRemoteLabels;
  });
  const options = [
    ...values.map(item => nextSelectedCache.get(item)).filter(Boolean),
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
