import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, Star, Image, ExternalLink, MessageSquare, LogOut, Shield, History, ArrowRight } from 'lucide-react';
import { usePathAssist } from '../../hooks/usePathAssist';
import ConfidenceBadge from '../medical/ConfidenceBadge';
import WarningBox from '../medical/WarningBox';
import DataQualityIndicator from '../medical/DataQualityIndicator';
import MarkdownRenderer from '../ui/MarkdownRenderer';

const MainApp = ({ apiKey, modelName, onDisconnect }) => {
  const [query, setQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  
  const { 
    loading, 
    error, 
    session, 
    searchHistory, 
    executeSearch, 
    sendChatMessage, 
    loadSession 
  } = usePathAssist(apiKey, modelName);

  const chatEndRef = useRef(null);

  // Auto-scroll chat UNIQUEMENT lors d'un nouveau message, pas au chargement initial
  useEffect(() => {
    if (session?.chatMessages?.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // On ne scroll pas si c'est juste la session qui change (recherche initiale)
  }, [session?.chatMessages?.length]);

  const handleSearch = () => {
    if (query.trim()) {
      executeSearch(query, 'pathout');
    }
  };

  const handleChatSubmit = () => {
    if (chatInput.trim()) {
      sendChatMessage(chatInput);
      setChatInput('');
    }
  };

  // Helper pour rendre les sources cliquables si elles contiennent une URL
  const renderSourceLink = (sourceText) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = sourceText.match(urlRegex);
    if (match) {
      const url = match[0];
      const text = sourceText.replace(url, '').trim() || url;
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
          <ExternalLink className="w-3 h-3 text-indigo-400" />
          {text}
        </a>
      );
    }
    // Fallback : recherche Google si pas d'URL
    return (
      <a href={`https://www.google.com/search?q=${encodeURIComponent(sourceText)}`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
        <ExternalLink className="w-3 h-3 text-gray-400" />
        {sourceText}
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">PathAssist Pro <span className="text-xs text-indigo-600 font-normal bg-indigo-50 px-2 py-0.5 rounded-full">v6 {modelName}</span></h1>
            </div>
          </div>
          <button 
            onClick={onDisconnect}
            className="text-gray-500 hover:text-red-600 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar Area */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ex: DDx carcinome rénal cellules claires..."
                className="w-full pl-5 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-lg transition-all"
              />
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* History Chips */}
          {searchHistory.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-1">Récents:</span>
              {searchHistory.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => loadSession(item.session)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-xs transition-colors flex items-center gap-1"
                >
                  <History className="w-3 h-3" />
                  {item.query}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r mb-8">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Area */}
        {session && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Column (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Direct Answer */}
              {session.initialSearch.directAnswer && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 flex justify-between items-start">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" />
                      Réponse Synthétique
                    </h2>
                    <ConfidenceBadge 
                      level={session.initialSearch.directAnswer.confidence} 
                      sources={session.initialSearch.directAnswer.sources} 
                    />
                  </div>
                  <div className="p-6">
                    <MarkdownRenderer content={session.initialSearch.directAnswer.text} />
                    
                    {/* Sources Direct Answer (Correctif Problème 4) */}
                    {session.initialSearch.directAnswer.sources?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Sources Vérifiées</p>
                        <ul className="space-y-1">
                          {session.initialSearch.directAnswer.sources.map((src, i) => (
                            <li key={i} className="text-xs text-gray-600">
                              {renderSourceLink(src)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Warning */}
              {session.initialSearch.userWarning && (
                <WarningBox message={session.initialSearch.userWarning} />
              )}

              {/* Tables */}
              {session.initialSearch.tables?.map((table, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">{table.title}</h3>
                    {table.dataQuality && (
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        table.dataQuality === 'complete' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {table.dataQuality === 'complete' ? 'Complet' : 'Partiel'}
                      </span>
                    )}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {table.headers.map((h, idx) => (
                            <th key={idx} className="px-4 py-3 text-left font-semibold text-gray-700">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-gray-100 hover:bg-gray-50">
                            {row.values.map((v, vIdx) => (
                              <td key={vIdx} className="px-4 py-3 text-gray-600">{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Narrative Sections */}
              {session.initialSearch.narrativeSections?.map((section, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>{section.icon}</span>
                    {section.title}
                  </h3>
                  <div className="space-y-2">
                    {section.content.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
                        <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
                           <MarkdownRenderer content={point} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Chat Interface */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-indigo-100 mt-8">
                <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
                  <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Assistant Virtuel
                  </h3>
                  
                </div>
                
                <div className="h-96 overflow-y-auto p-6 bg-gray-50/50 space-y-4">
                  {session.chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                      }`}>
                        {msg.role === 'user' ? (
                          <p>{msg.content}</p>
                        ) : (
                          <div className="prose prose-sm max-w-none">
                            <MarkdownRenderer content={msg.content} />
                            {/* Sources numérotées issues du JSON structuré */}
                            {msg.structuredData?.directAnswer?.sources?.filter(s => s && s.startsWith('http')).length > 0 && (
                              <div className="mt-3 pt-2 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sources Consultées</p>
                                <ol className="space-y-1 list-none p-0">
                                  {msg.structuredData.directAnswer.sources
                                    .filter(s => s && s.startsWith('http'))
                                    .map((src, idx) => (
                                      <li key={idx} className="flex items-start gap-1.5">
                                        <span className="text-xs text-gray-400 font-mono mt-0.5">[{idx + 1}]</span>
                                        <a
                                          href={src}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-indigo-600 hover:text-indigo-800 underline break-all inline-flex items-center gap-1"
                                        >
                                          {src.length > 70 ? src.substring(0, 70) + '…' : src}
                                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                        </a>
                                      </li>
                                    ))
                                  }
                                </ol>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 px-5 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        <span className="text-sm text-gray-500">Analyse en cours...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                      placeholder="Posez une question de suivi..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                    />
                    <button 
                      onClick={handleChatSubmit}
                      disabled={loading || !chatInput.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar Column (1/3) */}
            <div className="space-y-6">
              {/* Quality Indicator */}
              {session.initialSearch.searchAssessment && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <DataQualityIndicator 
                    quality={session.initialSearch.searchAssessment.overallQuality} 
                    missingInfo={session.initialSearch.searchAssessment.informationGaps} 
                  />
                </div>
              )}

              {/* Image Suggestions */}
              {session.initialSearch.imageSearches?.byEntity && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5 text-purple-500" />
                    Suggestions Images
                  </h3>
                  <div className="space-y-3">
                    {session.initialSearch.imageSearches.byEntity.map((item, i) => (
                      <a
                        key={i}
                        href={`https://www.google.com/search?q=${encodeURIComponent(item.keywords + ' site:pathologyoutlines.com OR site:webpathology.com OR site:pathology.jhu.edu OR site:utah.edu')}&tbm=isch`}
                        target="_blank"
                        rel="noreferrer"
                        className="block p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-100 group"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-purple-900 text-sm">{item.entity}</span>
                          <ExternalLink className="w-3 h-3 text-purple-400 group-hover:text-purple-600" />
                        </div>
                        <p className="text-xs text-purple-600 mt-1 truncate">{item.keywords}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Sources Log (Correctif Problème 3) */}
              {session.initialSearch.searchSources && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-500" />
                    Journal de Recherche
                  </h3>
                  <div className="space-y-4">
                    {session.initialSearch.searchSources.map((src, i) => (
                      <div key={i} className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                            {src.label || 'Web'}
                          </span>
                        </div>
                        <a 
                          href={`https://www.google.com/search?q=${encodeURIComponent(src.keywords)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-600 text-xs italic mb-1 hover:text-blue-600 hover:underline flex items-center gap-1"
                        >
                          "{src.keywords}" <ExternalLink className="w-3 h-3" />
                        </a>
                        <p className="text-gray-800 text-xs">{src.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !session && (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800">Analyse en cours...</h3>
            <p className="text-gray-500 mt-2">PathAssist interroge les bases de données médicales.</p>
          </div>
        )}
        
        {/* Empty State */}
        {!session && !loading && !error && (
          <div className="text-center py-20 opacity-50">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Prêt à assister votre diagnostic.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MainApp;
