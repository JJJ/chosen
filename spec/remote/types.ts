import { connectRemoteSelect, createRemoteSource, type RemoteLoader } from 'chosen-jjj/remote';

const load: RemoteLoader = async (query, request) => {
  request.signal.throwIfAborted();
  return [{ value: query, label: query }].slice(0, request.limit);
};
const controller = createRemoteSource(load, { limit: 6, onStatus: (_state, _query, _error, count) => {
  const resultCount: number | undefined = count;
  void resultCount;
} });
controller.search('be');
controller.dispose();

declare const select: HTMLSelectElement;
const connection = connectRemoteSelect(select, {
  load,
  subscribe(search) {
    select.addEventListener('chosen:search_updated', () => search('be'));
  },
  update() { select.dispatchEvent(new Event('chosen:updated')); }
});
connection.refresh();
