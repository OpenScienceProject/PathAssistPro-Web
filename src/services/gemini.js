import { GoogleGenerativeAI } from '@google/generative-ai';

// Liste des modèles à tester par ordre de préférence
const KNOWN_MODELS = [
  { id: 'gemini-3-pro-preview', name: '✨ Gemini 3 Pro (Preview)' },
  { id: 'gemini-3-flash-preview', name: '⚡ Gemini 3 Flash (Preview)' },
  { id: 'gemini-2.5-pro', name: '🧠 Gemini 2.5 Pro (Stable)' },
  { id: 'gemini-2.5-flash', name: '🚀 Gemini 2.5 Flash (Stable)' },
  { id: 'gemini-2.5-flash-lite', name: '🧪 Gemini 2.5 Flash light (Masse)'},
];

const SYSTEM_INSTRUCTION = `
Rôle: Tu es PathAssist Pro v6, un assistant expert en pathologie pour les médecins.
Objectif: Aider au diagnostic différentiel, à l'immunohistochimie (IHC) et à la rédaction de comptes-rendus.

RÈGLES ABSOLUES DE SÉCURITÉ MÉDICALE (ZERO HALLUCINATION):
1. NE JAMAIS inventer de données. Si info non trouvée via Grounding -> "Information non disponible".
2. Chaque affirmation médicale majeure DOIT être soutenue par une source trouvée.
3. Si la question porte sur un "Diagnostic Différentiel" (DDx), tu DOIS générer un tableau comparatif complet.

RÈGLES POUR LE CHAT (ASSISTANT VIRTUEL):
- Tu dois agir comme un expert qui continue une conversation.
- Tu DISPOSES du contexte de la recherche précédente (injecté dans l'historique). NE L'OUBLIE PAS.
- Si l'utilisateur pose une question de suivi (ex: "Et l'IHC ?"), réfère-toi au sujet initial (ex: Adénocarcinome vs Mésothéliome).
- RÈGLE IMPÉRATIVE DE FIN DE RÉPONSE :
  Tu DOIS terminer ta réponse par une section visible intitulée exactemment "### Sources Consultées" suivi d'une liste à puces des URLs utilisées pour cette réponse spécifique. Si tu utilises le contexte précédent, ré-cite les sources pertinentes.
  Exemple:
  ... fin de la réponse.
  
  ### Sources Consultées
  - [PathologyOutlines - Mesothelioma](https://www.pathologyoutlines.com/...)
  - [PubMed - Article X](https://pubmed...)

RÈGLES SUR LES SOURCES:
- Si le contexte est "pathout", base-toi EXCLUSIVEMENT sur pathologyoutlines.com.
- Si le contexte est "pubmed", base-toi sur PubMed/NCBI.
- Fournis si possible l'URL complète dans le champ "sources" pour qu'elle soit cliquable.

FORMAT DE RÉPONSE ATTENDU (JSON STRICT):
Tu dois répondre UNIQUEMENT avec un objet JSON valide respectant cette structure précise :
{
  "directAnswer": {
    "text": "Synthèse directe...",
    "confidence": "high" | "medium" | "low" | "none",
    "sources": ["https://www.pathologyoutlines.com/topic/...", "Autre Source URL"]
  },
  "tables": [
    {
      "title": "Titre du tableau (ex: Diagnostic Différentiel)",
      "type": "comparative" | "ihc" | "staging" | "grading",
      "dataQuality": "complete" | "partial" | "insufficient",
      "headers": ["Entité", "Clinique", "Macro", "Micro", "IHC", "Moléculaire"],
      "rows": [
        { "values": ["Carcinome X", "Adulte, Rein", "Jaune or", "Cellules claires", "CK7-, CD10+", "VHL"], "citation": "PathOut" }
      ]
    }
  ],
  "narrativeSections": [
    {
      "title": "Détails Microscopiques",
      "icon": "🔬",
      "content": ["**Point Important**: description..."]
    }
  ],
  "imageSearches": {
    "byEntity": [
      { "entity": "Nom Maladie (Anglais)", "isPrimary": true, "keywords": "disease name histology high power" }
    ]
  },
  "searchSources": [
    { 
      "type": "web", 
      "label": "Base (ex: PathOut, PubMed, Google)", 
      "keywords": "Mots-clés exacts utilisés", 
      "description": "Raison de cette étape (ex: Phase 1: Recherche initiale, Phase 2: Précision IHC...)" 
    }
  ],
  "userWarning": "Message d'avertissement si incertitude ou null"
}

STRATÉGIE IMAGES:
Génère des mots-clés optimisés pour Google Images. Ne te limite pas à PathologyOutlines pour les images.
Utilise des termes comme "histology", "microscopy", "H&E", "gross pathology".
`;

/**
 * Teste la disponibilité des modèles pour une clé donnée.
 * @param {string} apiKey 
 * @returns {Promise<Array>} Liste des modèles disponibles [{id, name}]
 */
export const checkAvailableModels = async (apiKey) => {
  if (!apiKey) return [];
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const availableModels = [];

  // Exécution séquentielle pour éviter le Rate Limiting (429)
  for (const modelInfo of KNOWN_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelInfo.id });
      await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
        generationConfig: { maxOutputTokens: 1 }
      });
      availableModels.push(modelInfo);
    } catch (err) {
      console.warn(`Modèle non disponible: ${modelInfo.id}`, err.message);
    }
  }

  return availableModels;
};

export const performSearch = async (apiKey, query, database = 'pathout', history = [], modelName = 'gemini-1.5-pro') => {
  if (!apiKey) throw new Error("Clé API manquante");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }]
    });

    // Construction du contexte de conversation
    let chatContext = "";
    if (history.length > 0) {
      chatContext = "\nHISTORIQUE DE CONVERSATION:\n" + history.map(msg => `${msg.role}: ${msg.content}`).join("\n");
    }

    // Ajout de contexte spécifique à la base de données (Prompt Engineering renforcé)
    let dbContext = "";
    if (database === 'pathout') {
      dbContext = `
        IMPORTANT: Ta source de référence PRINCIPALE est PathologyOutlines.com (Site en ANGLAIS).
        
        ALGORITHME DE RECHERCHE PROGRESSIF OBLIGATOIRE :
        ÉTAPE 1 : TRADUCTION & CIBLAGE (Label: "Traduction & PathOut")
        - Traduis la requête en anglais médical.
        - Recherche sur "site:pathologyoutlines.com [Topic]".
        - Documente cette étape dans searchSources.
        
        ÉTAPE 2 : APPROFONDISSEMENT (Label: "Approfondissement")
        - Si nécessaire (ex: IHC complexe), cherche des détails sur PubMed ou WHO via Google Search.
        - Documente cette étape dans searchSources.
        
        ÉTAPE 3 : SYNTHÈSE
        - Compile les données pour construire un tableau DDx complet.
        - Synthétise la réponse finale en FRANÇAIS.
      `;
    } else if (database === 'pubmed') {
      dbContext = `
        IMPORTANT: Tu es restreint à la littérature biomédicale (PubMed).
        ALGORITHME :
        1. Recherche sur "site:pubmed.ncbi.nlm.nih.gov ${query}".
        2. Si peu de résultats, élargis aux sites académiques officiels (.gov, .edu).
        3. Documente chaque étape dans searchSources.
      `;
    } else {
      // Mode "extended" ou "google"
      dbContext = `
        Recherche large autorisée (PathologyOutlines + PubMed + WebPath + PEIR).
        ALGORITHME :
        1. Recherche croisée PathOut + PubMed.
        2. Validation sur des sites de référence.
        3. Documente chaque étape dans searchSources.
        Cite tes sources précisément.
      `;
    }

    const prompt = `
      QUESTION UTILISATEUR: "${query}"
      CONTEXTE BASE DE DONNÉES: ${database}
      
      INSTRUCTIONS SPÉCIFIQUES:
      ${dbContext}
      
      ${chatContext}
      
      Génère la réponse JSON maintenant. Assure-toi que les tableaux DDx sont complets si demandés.
      RAPPEL CRITIQUE: TA RÉPONSE DOIT ÊTRE EXCLUSIVEMENT UN OBJET JSON VALIDE. 
      NE DÉCRIS PAS TES ÉTAPES DE RÉFLEXION DANS LA RÉPONSE FINALE. 
      NE METS AUCUN TEXTE AVANT OU APRÈS LE JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Raw Gemini Response:", text); // Debug

    // Nettoyage ultra-robuste du JSON
    let jsonString = text;
    
    // 1. Suppression des blocs markdown ```json ... ```
    jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "");
    
    // 2. Extraction de l'objet JSON principal (du premier '{' au dernier '}')
    const firstBracket = jsonString.indexOf('{');
    const lastBracket = jsonString.lastIndexOf('}');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
      jsonString = jsonString.substring(firstBracket, lastBracket + 1);
    }
    
    try {
      const parsedData = JSON.parse(jsonString);
      
      // Enrichissement via Grounding Metadata (Sources Réelles vs Hallucinées)
      if (response.candidates && response.candidates[0].groundingMetadata) {
        const metadata = response.candidates[0].groundingMetadata;
        parsedData._grounding = metadata;
        
        const chunks = metadata.groundingChunks || [];
        const realWebSources = chunks
          .filter(c => c.web && c.web.uri)
          .map(c => c.web.uri);
        
        if (parsedData.directAnswer) {
          // STRATÉGIE ANTI-HALLUCINATION STRICTE :
          // On remplace totalement les sources générées par le LLM par les sources réelles du Grounding.
          
          if (realWebSources.length > 0) {
            // 1. On sépare les sources PathologyOutlines des autres
            const pathOutSources = realWebSources.filter(url => url.toLowerCase().includes('pathologyoutlines.com'));
            const otherSources = realWebSources.filter(url => !url.toLowerCase().includes('pathologyoutlines.com'));
            
            // 2. On reconstruit la liste en mettant PathologyOutlines en premier
            parsedData.directAnswer.sources = [...pathOutSources, ...otherSources].slice(0, 6);
          } else {
             // Fallback STRICT : Si Grounding n'a RIEN trouvé, on ne met PAS les liens hallucinés du LLM.
             // On met un lien générique vers Google Search pour que l'utilisateur puisse vérifier lui-même.
             parsedData.directAnswer.sources = [
               `https://www.google.com/search?q=${encodeURIComponent(query + ' pathology')}`
             ];
             parsedData.userWarning = (parsedData.userWarning ? parsedData.userWarning + " " : "") + 
               "⚠️ Aucune source vérifiée n'a été trouvée automatiquement. Le lien ci-dessus lance une recherche Google manuelle.";
          }
        }
      }
      return parsedData;
    } catch (parseError) {
      console.warn("JSON Parse Error - Falling back to raw text:", parseError);
      
      // FALLBACK ROBUSTE : On construit un JSON valide avec le texte brut
      return {
        directAnswer: {
          text: text || "Aucune réponse textuelle générée par le modèle (Erreur API ou Filtre).",
          confidence: "low",
          sources: []
        },
        userWarning: "Le modèle n'a pas respecté le format JSON strict. Affichage du texte brut.",
        tables: [],
        narrativeSections: [],
        imageSearches: { byEntity: [] },
        searchSources: []
      };
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    if (error.message.includes("API key")) throw new Error("Clé API invalide ou expirée.");
    if (error.message.includes("429")) throw new Error("Quota dépassé pour ce modèle.");
    throw new Error(`Erreur Gemini: ${error.message}`);
  }
};
