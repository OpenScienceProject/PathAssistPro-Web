import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  runtime: 'edge',
};

const MEDICAL_RULES = `🚫 JAMAIS inventer données médicales/PMIDs.
✅ TOUJOURS utiliser l'outil de recherche Google (Grounding) pour vérifier les faits.
✅ Si manque info → null + userWarning.
✅ Format de sortie: JSON uniquement.`;

const JSON_SCHEME_HINT = `
SCHÉMA JSON OBLIGATOIRE:
{
  "directAnswer": {"text": "...", "confidence": "high|medium|low|none", "sources": ["url1"]},
  "tables": [{"title", "type", "dataQuality", "missingColumns": [], "headers": [], "rows": [{"values":[], "citation"}]}],
  "narrativeSections": [{"title", "icon", "confidence", "content": []}],
  "imageSearches": {"byEntity": [{"entity", "isPrimary": true|false, "keywords"}]}
  "searchSources": [{"type", "label", "keywords", "description"}],
  "searchAssessment": {"queriesPerformed", "relevantResults", "informationGaps": [], "overallQuality"},
  "userWarning": "..." ou null
}`;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { query, history, database } = await req.json();
    
    // 1. Récupération Sécurisée de la Clé API Utilisateur
    const apiKey = req.headers.get('x-gemini-api-key');
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Clé API manquante. Veuillez reconfigurer votre clé.' }), { status: 401 });
    }

    // 2. Initialisation Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Sélection du modèle Gemini 1.5 Pro (ou 3 si dispo sur la clé)
    // On utilise le dernier modèle stable avec Search
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro-latest",
      tools: [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: "MODE_DYNAMIC", dynamicThreshold: 0.7 } } }]
    });

    // 3. Construction du Prompt Contextuel
    let searchContext = "";
    if (database === 'pathout') {
      searchContext = "Concentrez vos recherches sur site:pathologyoutlines.com.";
    } else if (database === 'pubmed') {
      searchContext = "Concentrez vos recherches sur site:pubmed.ncbi.nlm.nih.gov.";
    }

    const prompt = `
      Rôle: Expert Pathologiste (PathAssistPro).
      Question: "${query}"
      Contexte Base de Données: ${searchContext || "Recherche générale fiable"}
      
      ${MEDICAL_RULES}
      ${JSON_SCHEME_HINT}
      
      Historique conversation (si pertinent): ${JSON.stringify(history || [])}
    `;

    // 4. Exécution
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. Nettoyage JSON (Gemini peut parfois mettre du Markdown autour)
    const jsonString = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    // Validation basique
    JSON.parse(jsonString);

    // 6. Gestion des métadonnées de Grounding (Sources)
    // Gemini renvoie les sources dans response.candidates[0].groundingMetadata
    // Nous pourrions les injecter dans le JSON ici si besoin, mais le modèle est instruit pour les inclure dans "sources"
    
    return new Response(jsonString, {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message, 
      details: 'Assurez-vous que votre clé API a accès à Gemini Pro et Google Search.' 
    }), { status: 500 });
  }
}
