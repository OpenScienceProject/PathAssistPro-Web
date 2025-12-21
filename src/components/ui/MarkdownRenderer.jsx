import React from 'react';
import { ExternalLink } from 'lucide-react';

const MarkdownRenderer = ({ content }) => {
  const renderContent = (text) => {
    if (!text) return null;
    
    // Détection basique des tableaux Markdown
    if (text.includes('|')) {
      const lines = text.split('\n');
      const tableLines = [];
      let inTable = false;
      const nonTableContent = [];
      
      lines.forEach(line => {
        if (line.trim().startsWith('|')) {
          inTable = true;
          tableLines.push(line);
        } else {
          if (inTable && tableLines.length > 0) {
            nonTableContent.push(renderTable(tableLines));
            tableLines.length = 0;
            inTable = false;
          }
          nonTableContent.push(line);
        }
      });
      
      if (tableLines.length > 0) {
        nonTableContent.push(renderTable(tableLines));
      }
      
      return nonTableContent.map((item, idx) => 
        typeof item === 'string' ? renderLine(item, idx) : <div key={idx}>{item}</div>
      );
    }
    
    return text.split('\n').map((line, idx) => renderLine(line, idx));
  };
  
  const renderTable = (lines) => {
    const rows = lines.filter(line => !line.includes('---')).map(line => 
      line.split('|').filter(cell => cell.trim()).map(cell => cell.trim())
    );
    
    if (rows.length === 0) return null;
    
    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    return (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full border-collapse border-2 border-gray-300">
          <thead>
            <tr className="bg-indigo-50">
              {headers.map((header, i) => (
                <th key={i} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {row.map((cell, j) => (
                  <td key={j} className="border border-gray-300 px-3 py-2 text-gray-700">
                    {renderInlineFormatting(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderLine = (line, idx) => {
    if (line.startsWith('### ')) {
      return <h3 key={idx} className="text-lg font-bold text-gray-800 mt-3 mb-2">{line.substring(4)}</h3>;
    }
    if (line.startsWith('## ')) {
      return <h2 key={idx} className="text-xl font-bold text-gray-800 mt-4 mb-2">{line.substring(3)}</h2>;
    }
    if (line.startsWith('# ')) {
      return <h1 key={idx} className="text-2xl font-bold text-gray-800 mt-4 mb-3">{line.substring(2)}</h1>;
    }
    
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      return (
        <div key={idx} className="flex items-start gap-2 ml-4 my-1">
          <span className="text-indigo-600 font-bold mt-1">•</span>
          <span className="flex-1">{renderInlineFormatting(line.trim().substring(2))}</span>
        </div>
      );
    }
    
    if (line.trim() === '') {
      return <div key={idx} className="h-2"></div>;
    }
    
    return <p key={idx} className="my-1">{renderInlineFormatting(line)}</p>;
  };
  
  const renderInlineFormatting = (text) => {
    if (typeof text !== 'string') return text;
    
    // Détecter et rendre les URLs cliquables
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    const processedParts = [];
    parts.forEach((part, i) => {
      if (part && part.match(urlRegex)) {
        let cleanUrl = part.replace(/[.,;:!?)]+$/, '');
        processedParts.push(
          <a 
            key={`url-${i}`}
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-1"
          >
            {cleanUrl.length > 60 ? cleanUrl.substring(0, 60) + '...' : cleanUrl}
            <ExternalLink className="w-3 h-3 inline" />
          </a>
        );
        if (part !== cleanUrl) {
          processedParts.push(part.substring(cleanUrl.length));
        }
      } else if (part) {
        // Gras (**texte**)
        let boldParts = part.split(/(\**.*?\**)/g);
        boldParts.forEach((boldPart, j) => {
          if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
            processedParts.push(
              <strong key={`${i}-${j}-b`} className="font-bold">
                {boldPart.slice(2, -2)}
              </strong>
            );
          } else if (boldPart) {
            // Italique (*texte*)
            const italicParts = boldPart.split(/(\*[^*]+?\*)/g);
            italicParts.forEach((iPart, k) => {
              if (iPart.startsWith('*') && iPart.endsWith('*') && !iPart.startsWith('**')) {
                processedParts.push(
                  <em key={`${i}-${j}-${k}-i`} className="italic">
                    {iPart.slice(1, -1)}
                  </em>
                );
              } else if (iPart) {
                processedParts.push(iPart);
              }
            });
          }
        });
      }
    });
    
    return processedParts.length > 0 ? processedParts : text;
  };
  
  return <div className="markdown-content">{renderContent(content)}</div>;
};

export default MarkdownRenderer;
