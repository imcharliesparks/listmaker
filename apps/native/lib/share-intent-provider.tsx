import Constants from 'expo-constants';
import { useShareIntent } from 'expo-share-intent';
import * as React from 'react';

type ShareIntentState = ReturnType<typeof useShareIntent>;

const ShareIntentContext = React.createContext<ShareIntentState | null>(null);

function getIsExpoGo() {
  // https://docs.expo.dev/versions/latest/sdk/constants/#constantsappownership
  return Constants.appOwnership === 'expo';
}

export function ShareIntentProvider({ children }: { children: React.ReactNode }) {
  const state = useShareIntent({ disabled: getIsExpoGo() });
  return <ShareIntentContext.Provider value={state}>{children}</ShareIntentContext.Provider>;
}

export function useShareIntentState() {
  const ctx = React.useContext(ShareIntentContext);
  if (!ctx) {
    throw new Error('useShareIntentState must be used within ShareIntentProvider');
  }
  return ctx;
}

