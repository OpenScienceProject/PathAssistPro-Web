# PathAssist Pro v6 (Web App)

PathAssist Pro est une application web d'aide au diagnostic pathologique, propulsée par l'IA Google Gemini. Elle remplace l'ancien artefact monolithique par une architecture moderne, modulaire et maintenable.

## 🚀 Démarrage Rapide

### Prérequis
*   Node.js (v18 ou supérieur)
*   Une clé API Google Gemini (gratuite via Google AI Studio)

### Installation & Lancement

1.  **Ouvrez votre terminal** et naviguez dans le dossier `web-app` :
    ```bash
    cd /home/damien-brisou/dev_ops/gemini_cli/PathAssist/web-app
    ```

2.  **Installez les dépendances** (si ce n'est pas déjà fait) :
    ```bash
    npm install
    ```

3.  **Lancez le serveur de développement** :
    ```bash
    npm run dev
    ```

4.  **Accédez à l'application** :
    *   Ouvrez votre navigateur à l'adresse : [http://localhost:5173/](http://localhost:5173/)
    *   Suivez les instructions à l'écran ("Onboarding") pour entrer votre clé API.

## 🛠️ Commandes Utiles

| Commande | Description |
| :--- | :--- |
| `npm run dev` | Lance le serveur de développement en mode local. |
| `npm run build` | Compile l'application pour la production (dossier `dist/`). |
| `npm run lint` | Analyse le code pour détecter les erreurs de style et de syntaxe. |
| `npm run preview` | Prévisualise la version de production en local. |

## 🏗️ Architecture

*   **Frontend** : React 19 + Vite v7
*   **Style** : Tailwind CSS v4
*   **IA** : Google Gemini API (`@google/generative-ai`)

L'application est "Client-Side Only" pour la gestion des clés API : votre clé est stockée uniquement dans le `localStorage` de votre navigateur et n'est jamais envoyée à un serveur tiers (autre que Google pour l'inférence).

## 📄 Fonctionnalités Clés
*   **Recherche Standard** : Ciblée sur *PathologyOutlines.com*.
*   **Recherche Étendue** : Inclut PubMed et la littérature biomédicale.
*   **Grounding** : Vérification automatique des sources via Google Search pour éviter les hallucinations (erreurs 404).
*   **Chat Contextuel** : Assistant virtuel capable de répondre aux questions de suivi tout en gardant les résultats visibles.