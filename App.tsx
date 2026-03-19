import React, { useState, useCallback } from 'react';
import DownloadScreen from './src/screens/DownloadScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import ChatScreen from './src/screens/ChatScreen';

type AppState = 'download' | 'loading' | 'chat' | 'error';

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<AppState>('download');

  const onDownloadComplete = useCallback(() => {
    setScreen('loading');
  }, []);

  const onModelLoaded = useCallback(() => {
    setScreen('chat');
  }, []);

  const onModelError = useCallback((msg: string) => {
    console.warn('Model error:', msg);
    setScreen('error');
  }, []);

  switch (screen) {
    case 'download':
      return <DownloadScreen onComplete={onDownloadComplete} />;
    case 'loading':
      return (
        <LoadingScreen onComplete={onModelLoaded} onError={onModelError} />
      );
    case 'chat':
      return <ChatScreen />;
    case 'error':
      return (
        <LoadingScreen onComplete={onModelLoaded} onError={onModelError} />
      );
    default:
      return <DownloadScreen onComplete={onDownloadComplete} />;
  }
}

export default App;
