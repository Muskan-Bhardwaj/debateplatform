import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/client';

// Runs an async loader on mount (and whenever deps change) and tracks loading/error state.
// Call reload() after a mutation to refresh the data.
export function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const latestRequest = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await loader();
      if (requestId === latestRequest.current) setState({ data, loading: false, error: '' });
    } catch (err) {
      if (requestId === latestRequest.current) {
        setState({ data: null, loading: false, error: getErrorMessage(err) });
      }
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
