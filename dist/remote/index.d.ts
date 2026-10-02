export interface RemoteRecord {
  value: string | number;
  label: string;
}

export interface RemoteRequest {
  signal: AbortSignal;
  limit: number;
}

export type RemoteLoader = (query: string, request: RemoteRequest) => Promise<readonly RemoteRecord[]> | readonly RemoteRecord[];
export type RemoteStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface RemoteController {
  search(query: string): void;
  refresh(): void;
  dispose(): void;
}

export interface RemoteOptions {
  minLength?: number;
  limit?: number;
  onStatus?: (status: RemoteStatus, query: string, error?: unknown, count?: number) => void;
}

export function createRemoteSource(load: RemoteLoader, options?: RemoteOptions & {
  onResults?: (records: Array<{ value: string; label: string }>, query: string) => void;
}): RemoteController;

export function connectRemoteSelect(select: HTMLSelectElement, options: RemoteOptions & {
  load: RemoteLoader;
  subscribe: (search: (query: string) => void) => void | (() => void);
  update: () => void;
}): RemoteController;
