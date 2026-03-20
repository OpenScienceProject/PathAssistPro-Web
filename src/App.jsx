import React, { useState } from 'react';
import Onboarding from './components/layout/Onboarding';
import MainApp from './components/layout/MainApp';

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key'));
  const [modelName] = useState('gemini-2.5-flash-lite');

  const handleOnboardingComplete = (key) => {
    setApiKey(key);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('gemini_model_name');
    setApiKey(null);
  };

  if (!apiKey) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return <MainApp apiKey={apiKey} modelName={modelName} onDisconnect={handleDisconnect} />;
}

export default App;