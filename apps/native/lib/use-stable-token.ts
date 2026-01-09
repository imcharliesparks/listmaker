import { useAuth } from '@clerk/clerk-expo';
import * as React from 'react';

export function useStableGetToken() {
  const { getToken } = useAuth();
  const getTokenRef = React.useRef(getToken);

  React.useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  return React.useCallback(() => getTokenRef.current(), []);
}

