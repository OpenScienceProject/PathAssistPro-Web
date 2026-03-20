import { useState, useCallback } from 'react';
import { performSearch } from '../services/gemini';

export const usePathAssist = (apiKey, modelName = 'gemini-3-pro') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  // Recherche Initiale (Nouvelle Session)
  const executeSearch = useCallback(async (query, database = 'pathout') => {
    if (!query.trim() || !apiKey) return;

    setLoading(true);
    setError(null);
    setSession(null);

    try {
      const result = await performSearch(apiKey, query, database, [], modelName);
      
      const newSession = {
        metadata: {
          query,
          createdAt: new Date().toISOString(),
          database,
          modelName
        },
        initialSearch: result,
        chatMessages: []
      };

      setSession(newSession);
      
      // Ajout à l'historique local
      setSearchHistory(prev => [{
        query,
        timestamp: new Date().toLocaleTimeString(),
        session: newSession
      }, ...prev.slice(0, 4)]); // Garder les 5 derniers

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiKey, modelName]);

  // Chat (Question suivante dans la même session)
  const sendChatMessage = useCallback(async (message) => {
    if (!session || !apiKey) return;

    // 1. Ajouter le message utilisateur immédiatement
    const userMsg = { role: 'user', content: message };
    setSession(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, userMsg]
    }));
    setLoading(true);

    try {
      // 2. Appeler Gemini avec l'historique
      // ENRICHISSEMENT DU CONTEXTE (Fix Corpus): On injecte le résultat de la recherche initiale
      // pour que l'assistant n'oublie pas le sujet principal (ex: Adenocarcinome vs Mésothéliome).
      
      const tablesSummary = session.initialSearch.tables 
        ? JSON.stringify(session.initialSearch.tables.map(t => ({ title: t.title, headers: t.headers, sampleRows: t.rows.slice(0, 5) }))) 
        : "Aucun tableau";

      const initialContextMsg = {
        role: 'model', // On fait passer ça pour une réponse précédente du modèle
        content: `CONTEXTE INITIAL ÉTABLI (RÉSUMÉ):
        SUJET DE RECHERCHE INITIALE: "${session.metadata.query}"
        
        RÉPONSE SYNTHÉTIQUE:
        ${session.initialSearch.directAnswer?.text || "Recherche effectuée."}
        
        DONNÉES STRUCTURÉES (Tableaux):
        ${tablesSummary}
        
        SOURCES INITIALES:
        ${(session.initialSearch.directAnswer?.sources || []).join(', ')}
        `
      };

      // On reconstruit l'historique complet : [Contexte Initial] + [Chat précédents] + [Question actuelle]
      const history = [initialContextMsg, ...session.chatMessages, userMsg];
      
      // Chat uses 'extended' so the model can search freely (PathOut + PubMed + Web)
      const result = await performSearch(apiKey, message, 'extended', history, modelName);

      // 3. Ajouter la réponse de l'assistant
      // Note: Le format de retour de Gemini est complexe (celui de performSearch). 
      // Pour le chat, on simplifie souvent, mais ici on garde la richesse (tableaux, etc.)
      // On va extraire le texte principal pour le chat, ou afficher un bloc structuré.
      
      const assistantContent = result.directAnswer?.text || "Voici les informations trouvées.";
      
      const assistantMsg = { 
        role: 'assistant', 
        content: assistantContent,
        structuredData: result // On garde tout le JSON pour un affichage riche si besoin
      };

      setSession(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, assistantMsg]
      }));

    } catch (err) {
      setSession(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, { role: 'assistant', content: `❌ Erreur: ${err.message}` }]
      }));
    } finally {
      setLoading(false);
    }
  }, [apiKey, session, modelName]);

  const loadSession = (savedSession) => {
    setSession(savedSession);
  };

  return {
    loading,
    error,
    session,
    searchHistory,
    executeSearch,
    sendChatMessage,
    loadSession
  };
};
