import React, { createContext, useContext, useRef } from 'react';

const GlobalAudioContext = createContext<AudioContext | null>(null);

export const GlobalAudioContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const globalAudioCtxRef = useRef<AudioContext | null>(null);

  if (globalAudioCtxRef.current == null) {
    globalAudioCtxRef.current = new AudioContext();
  }

  return (
    <GlobalAudioContext.Provider value={globalAudioCtxRef.current}>
      {children}
    </GlobalAudioContext.Provider>
  );
};

export const useGlobalAudioContext = () => {
  const audioContext = useContext(GlobalAudioContext);
  if (audioContext == null) {
    throw new Error('woops...globalaudiocontext error');
  }

  return audioContext;
};
