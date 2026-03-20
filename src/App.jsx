import React, { useState } from 'react';
import Onboarding from './components/layout/Onboarding';
import MainApp from './components/layout/MainApp';

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key'));
  const [modelName, setModelName] = useState(() => localStorage.getItem('gemini_model_name') || 'gemini-3-pro-preview');

  // useEffect removed as state is now initialized lazily

  const handleOnboardingComplete = (key, model) => {
    setApiKey(key);
    setModelName(model);
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