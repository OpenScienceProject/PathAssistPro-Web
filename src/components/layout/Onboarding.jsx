import React, { useState } from 'react';
import { Key, ExternalLink, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { checkAvailableModels } from '../../services/gemini';

const FIXED_MODEL = 'gemini-2.5-flash-lite';

const Onboarding = ({ onComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleCheckKey = async () => {
    if (!apiKey.startsWith('AIza')) {
      setError('Cette clé ne semble pas valide (elle devrait commencer par "AIza").');
      return;
    }

    setChecking(true);
    setError('');

    try {
      const models = await checkAvailableModels(apiKey);

      if (models.length === 0) {
        setError("Clé valide mais AUCUN modèle n'est accessible (Quota 0 ou Restriction Géographique). Essayez de créer un nouveau projet Google Cloud.");
      } else {
        localStorage.setItem('gemini_api_key', apiKey);
        localStorage.setItem('gemini_model_name', FIXED_MODEL);
        onComplete(apiKey, FIXED_MODEL);
      }
    } catch {
      setError("Impossible de vérifier la clé. Vérifiez votre connexion.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 p-8 text-white text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-bold mb-2">Bienvenue sur PathAssist Pro</h1>
          <p className="text-indigo-100 text-lg">Votre assistant de diagnostic pathologique sécurisé</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" />
              Configuration de la Clé API
            </h2>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Clé Gratuite Requise</h3>
              <p className="text-sm text-blue-800 mb-2">
                 PathAssist utilise votre quota gratuit personnel. Nous ne stockons jamais votre clé.
              </p>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-sm underline font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1">
                Obtenir une clé sur Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clé API (commence par AIza...)</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && !checking && apiKey && handleCheckKey()}
                    placeholder="Collez votre clé ici..."
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors font-mono"
                  />
                  <button
                    onClick={handleCheckKey}
                    disabled={!apiKey || checking}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lancer'}
                  </button>
                </div>
                {error && (
                  <p className="mt-3 text-sm text-red-600 flex items-start gap-2 bg-red-50 p-3 rounded-lg border border-red-200">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-gray-400 mt-8">
            v6.0.0 • Powered by Google Gemini • Secure Client-Side Only
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
