'use client';

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import FeedbackButton from '../../components/FeedbackButton';
import IntroModal from '../../components/IntroModal';
import ActivityLink from '../../components/ActivityLink';
import { useStarredActivities } from '../../contexts/StarredContext';

interface Tool {
  [key: string]: string;
}

interface FormattedTextProps {
  children?: string;
  tools?: Tool[];
  currentToolId?: string;
}

const GUIDE_SECTIONS = [
  'Written Guide - Intro',
  'Written Guide - Target Audience',
  'Written Guide - Issues',
  'Written Guide - Setup',
  'Written Guide - Walkthrough'
];

const getEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|watch\?v=)([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

const Video = ({ title, src }: { title: string; src: string }) => (
  <div>
    <h3 className="font-semibold mb-2">{title}</h3>
    <div className="px-0 sm:px-8 md:px-16 lg:px-24">
      <div className="relative rounded overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <iframe 
          className="absolute top-0 left-0 w-full h-full" 
          src={src} 
          title={title} 
          frameBorder="0" 
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen 
        />
      </div>
    </div>
  </div>
);

const FormattedText = ({ children, tools = [], currentToolId }: FormattedTextProps) => {
  if (!children) return null;
  
  // Build tool lookup structures
  const toolMap = new Map<string, Tool>();
  const sortedToolNames: string[] = [];
  
  if (tools.length > 0) {
    tools.forEach(tool => {
      const displayName = tool['Display Name'] || tool['code name'];
      if (displayName && tool.id !== currentToolId && displayName.toLowerCase() !== 'other') {
        toolMap.set(displayName.toLowerCase(), tool);
        sortedToolNames.push(displayName);
      }
    });
    
    // Sort by length (longest first) for proper matching
    sortedToolNames.sort((a, b) => b.length - a.length);
  }
  
  const escapeRegex = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  const processToolLinks = (text: string): (string | React.JSX.Element)[] => {
    if (sortedToolNames.length === 0) {
      return [text];
    }
    
    let result: (string | React.JSX.Element)[] = [text];
    
    sortedToolNames.forEach((toolName, index) => {
      const newResult: (string | React.JSX.Element)[] = [];
      
      result.forEach((item) => {
        if (typeof item === 'string') {
          const regex = new RegExp(`\\b${escapeRegex(toolName)}\\b`, 'gi');
          const parts = item.split(regex);
          const matches = item.match(regex) || [];
          
          for (let i = 0; i < parts.length; i++) {
            if (parts[i]) {
              newResult.push(parts[i]);
            }
            if (i < matches.length) {
              const tool = toolMap.get(toolName.toLowerCase());
              if (tool) {
                newResult.push(
                  <ActivityLink key={`${tool.id}-${index}-${i}`} activity={tool}>
                    {matches[i]}
                  </ActivityLink>
                );
              } else {
                newResult.push(matches[i]);
              }
            }
          }
        } else {
          newResult.push(item);
        }
      });
      
      result = newResult;
    });
    
    return result;
  };
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const formatTextWithLinks = (text: string) => {
    // First process tool links
    const withToolLinks = processToolLinks(text);
    
    // Then process URL links on string parts only
    const finalResult: (string | React.JSX.Element)[] = [];
    
    withToolLinks.forEach((item, itemIndex) => {
      if (typeof item === 'string') {
        const parts = item.split(urlRegex);
        parts.forEach((part, partIndex) => {
          if (urlRegex.test(part)) {
            finalResult.push(
              <a
                key={`url-${itemIndex}-${partIndex}`}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline transition-all duration-200"
                style={{ color: '#F97316' }}
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </a>
            );
          } else if (part) {
            finalResult.push(part);
          }
        });
      } else {
        finalResult.push(item);
      }
    });
    
    return finalResult;
  };
  
  const lines = children.split('\n');
  const elements = [];
  let currentList: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(trimmed.substring(2));
    } else {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${i}`} className="list-disc list-inside mb-2 space-y-1">
            {currentList.map((item, idx) => (
              <li key={idx} className="text-gray-700">
                {formatTextWithLinks(item)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
      
      if (trimmed || elements.length === 0) {
        elements.push(
          <div key={`text-${i}`} className={`${trimmed ? "mb-2" : "mb-1"} text-gray-700`}>
            {line ? formatTextWithLinks(line) : '\u00A0'}
          </div>
        );
      }
    }
  }
  
  if (currentList.length > 0) {
    elements.push(
      <ul key="list-final" className="list-disc list-inside mb-2 space-y-1">
        {currentList.map((item, idx) => (
          <li key={idx} className="text-gray-700">
            {formatTextWithLinks(item)}
          </li>
        ))}
      </ul>
    );
  }
  
  return <div>{elements}</div>;
};

const TipsSection = ({ content, tools = [], currentToolId }: { 
  content?: string; 
  tools?: Tool[];
  currentToolId?: string;
}) => {
  const [tipsOpen, setTipsOpen] = useState(false);
  
  const toggleTips = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTipsOpen(prev => !prev);
  };

  if (!content) return null;

  return (
    <div>
      <button 
        className="w-full text-left rounded-lg p-3 transition-colors duration-200 focus:outline-none focus:ring-2 bg-gray-100 hover:bg-gray-200"
        style={{ 
          border: `2px solid #F97316`
        }}
        onClick={toggleTips}
      >
        <h4 className="font-extrabold flex items-center gap-2" style={{ color: '#F97316' }}>
          <span className={`transform transition-transform ${tipsOpen ? 'rotate-90' : ''}`}>▶</span>
          Tips and Tricks 🎯🧠
        </h4>
      </button>
      {tipsOpen && (
        <div className="mt-2 ml-6">
          <FormattedText tools={tools} currentToolId={currentToolId}>{content}</FormattedText>
        </div>
      )}
    </div>
  );
};

const DemoSection = ({ demoUrl }: { demoUrl?: string }) => {
  const [demoOpen, setDemoOpen] = useState(false);
  
  const toggleDemo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDemoOpen(prev => !prev);
  };

  if (!demoUrl) return null;

  return (
    <div>
      <button 
        className="w-full text-left rounded-lg p-3 transition-colors duration-200 focus:outline-none focus:ring-2 bg-gray-100 hover:bg-gray-200"
        style={{ 
          border: `2px solid #F97316`
        }}
        onClick={toggleDemo}
      >
        <h4 className="font-extrabold flex items-center gap-2" style={{ color: '#F97316' }}>
          <span className={`transform transition-transform ${demoOpen ? 'rotate-90' : ''}`}>▶</span>
          Demonstration video 🎥
        </h4>
      </button>
      {demoOpen && (
        <div className="mt-2 ml-6">
          <Video title="" src={demoUrl} />
        </div>
      )}
    </div>
  );
};

interface CardProps {
  tool: Tool;
  isOpen: boolean;
  onToggle: (toolId: string) => void;
  cardRef?: (el: HTMLDivElement | null) => void;
  tools: Tool[];
}

const Card = ({ tool, isOpen, onToggle, cardRef, tools }: CardProps) => {
  const { isStarred, toggleStar } = useStarredActivities();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on the external link icon, feedback button, or star button
    if ((e.target as HTMLElement).closest('.external-link-icon') || 
        (e.target as HTMLElement).closest('button')) {
      return;
    }
    onToggle(tool.id);
  };

  const handleMiddleClick = (e: React.MouseEvent) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      window.open(`/tool/${tool.id}`, '_blank');
    }
  };

  const handleExternalLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/tool/${tool.id}`, '_blank');
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If this card is currently open and we're starring it, we'll need to follow it
    const wasStarred = isStarred(tool.id);
    const willBeStarred = !wasStarred;
    
    // Toggle the star
    toggleStar(tool.id);
    
    // If card is open and moving to starred section, we'll scroll to it after re-render
    if (isOpen && willBeStarred) {
      // Use a short timeout to allow React to re-render the moved card
      setTimeout(() => {
        const starredCard = document.querySelector(`[data-tool-id="${tool.id}"]`);
        if (starredCard) {
          starredCard.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
    }
  };
  
  const whyUrl = getEmbedUrl(tool['Video What and why']);
  const demoUrl = getEmbedUrl(tool['Video Demo']);

  return (
    <div 
      ref={cardRef}
      data-tool-id={tool.id}
      onClick={handleCardClick}
      onMouseDown={handleMiddleClick}
      className="cursor-pointer rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 relative"
      style={{ backgroundColor: '#FFFFFE' }}
    >
      {/* Top right buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
        <button
          onClick={handleStarClick}
          className="p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-300"
          style={{ 
            color: isStarred(tool.id) ? '#F59E0B' : '#9CA3AF'
          }}
          title={isStarred(tool.id) ? 'Remove from starred' : 'Add to starred'}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill={isStarred(tool.id) ? 'currentColor' : 'none'}
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
          </svg>
        </button>
        <button
          onClick={handleExternalLinkClick}
          className="external-link-icon p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2"
          style={{ 
            color: '#F97316'
          }}
          title="Open in new tab"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15,3 21,3 21,9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>
      </div>

      {/* Tool feedback button */}
      <div className="absolute bottom-3 right-3 z-10">
        <FeedbackButton 
          type="activity" 
          activityId={tool.id} 
          activityName={tool['Display Name'] || tool['code name']}
        />
      </div>

      <header className="p-4 sm:p-6 border-b space-y-2" style={{ borderColor: '#D1D5DB' }}>
        <h2 className="text-xl sm:text-2xl font-extrabold break-words pr-8" style={{ color: '#230E77' }}>
          {tool['Display Name'] || tool['code name']}
        </h2>
        <pre className="text-sm whitespace-pre-wrap break-words text-gray-700">
          {tool['Short Description']}
        </pre>
        <p className="text-xs font-roboto text-gray-400">
          ID: {tool['id']} &middot; Code: {tool['code name']}
        </p>
      </header>

      <div className="p-4 sm:p-6 space-y-4 pb-12">
        <div className="flex flex-wrap gap-2">
          {tool['Type'] && (
            <span className="px-2 py-1 rounded-full text-xs font-medium font-roboto" style={{ backgroundColor: '#FB923C', color: '#FFFFFE' }}>
              {tool['Type']}
            </span>
          )}
          {tool['Platform'] && (
            <span className="px-2 py-1 rounded-full text-xs font-medium font-roboto" style={{ backgroundColor: '#F97316', color: '#FFFFFE' }}>
              {tool['Platform']}
            </span>
          )}
          {tool['Pricing'] && (
            <span className="px-2 py-1 rounded-full text-xs font-medium font-roboto" style={{ backgroundColor: '#FDBA74', color: '#230E77' }}>
              {tool['Pricing']}
            </span>
          )}
          {tool['Technical Rating'] && (
            <span className="px-2 py-1 rounded-full text-xs font-medium font-roboto" style={{ backgroundColor: '#FED7AA', color: '#230E77' }}>
              {tool['Technical Rating']}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 text-sm text-gray-600">
          {tool['Languages'] && (
            <div className="break-words">
              <strong>Languages:</strong> {tool['Languages']}
            </div>
          )}
          {tool['Parent Skills'] && (
            <div className="break-words">
              <strong>Skills:</strong> {tool['Parent Skills']}
            </div>
          )}
          {tool['Alternatives'] && (
            <div className="break-words">
              <strong>Alternatives:</strong> <FormattedText tools={tools} currentToolId={tool.id}>{tool['Alternatives']}</FormattedText>
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="p-4 sm:p-6 bg-gray-50 space-y-6">
          <FormattedText tools={tools} currentToolId={tool.id}>{tool['Long Description']}</FormattedText>
          {(whyUrl || demoUrl) && (
            <div className="space-y-6">
              {whyUrl && <Video title="What & Why" src={whyUrl} />}
              <DemoSection demoUrl={demoUrl || undefined} />
            </div>
          )}
          {tool['Benefits'] && (
            <div>
              <strong style={{ color: '#230E77' }}>Benefits:</strong>
              <ul className="list-disc list-inside mt-1 text-gray-700">
                {tool['Benefits'].split(/;+/).map((b, i) => (
                  <li key={i}>{b.trim()}</li>
                ))}
              </ul>
              <hr className="mt-6 border-gray-300" />
            </div>
          )}
          {GUIDE_SECTIONS.map(sec => tool[sec] && (
            <div key={sec}>
              <h4 className="font-extrabold" style={{ color: '#230E77' }}>
                {sec.replace('Written Guide - ','')
                   .replace('Target Audience', 'Who this tool is for')
                   .replace('Intro', `${tool['Display Name'] || tool['code name']} Overview`)
                   .replace('Issues', 'Common issues and questions')}
              </h4>
              <FormattedText tools={tools} currentToolId={tool.id}>{tool[sec]}</FormattedText>
            </div>
          ))}
          <TipsSection content={tool['Written Guide - Tips and Tricks']} tools={tools} currentToolId={tool.id} />
        </div>
      )}
    </div>
  );
};

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    platform: [] as string[],
    pricing: '',
    technicalRating: ''
  });

  const { starredIds, isLoaded: starredLoaded } = useStarredActivities();

  // Handle scroll to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const toggleCard = (toolId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolId)) {
        newSet.delete(toolId);
      } else {
        newSet.add(toolId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/export_activity_library.tsv');
        const text = await response.text();
        
        Papa.parse(text, {
          header: true,
          delimiter: '\t',
          skipEmptyLines: false,
          complete: (res) => {
            const cleaned = (res.data as Record<string, unknown>[]).map((r) => {
              const o: Tool = {};
              Object.entries(r).forEach(([k, v]) => {
                o[k] = typeof v === 'string' ? v.replace(/\r/g, '').replace(/⏎/g, '\n').trim() : v as string;
              });
              return o;
            });
            
            // Filter to only show tools (not activities)
            const toolsOnly = cleaned.filter(item => item.Library === 'Tools');
            
            // Sort by ID (convert to number for proper sorting)
            const sorted = toolsOnly.sort((a, b) => {
              const idA = parseInt(a.id) || 0;
              const idB = parseInt(b.id) || 0;
              return idA - idB;
            });
            
            setTools(sorted);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const getUniqueOptions = (field: string): string[] => {
    const values = new Set<string>();
    tools.forEach(tool => {
      const value = tool[field];
      if (value) {
        values.add(value.trim());
      }
    });
    return Array.from(values).sort();
  };

  const getUniquePlatforms = (): string[] => {
    const values = new Set<string>();
    tools.forEach(tool => {
      const value = tool['Platform'];
      if (value) {
        // Split platforms by comma or semicolon and trim
        value.split(/[,;]+/).forEach(platform => {
          const trimmed = platform.trim();
          if (trimmed) values.add(trimmed);
        });
      }
    });
    return Array.from(values).sort();
  };

  const clearFilters = () => {
    setFilters({ platform: [], pricing: '', technicalRating: '' });
  };

  const togglePlatformFilter = (platform: string) => {
    setFilters(prev => ({
      ...prev,
      platform: prev.platform.includes(platform)
        ? prev.platform.filter(p => p !== platform)
        : [...prev.platform, platform]
    }));
  };

  const filtered = tools.filter(tool => {
    const matchesQuery = Object.values(tool).join(' ').toLowerCase().includes(query.toLowerCase());
    const matchesPricing = !filters.pricing || tool['Pricing'] === filters.pricing;
    const matchesTechnicalRating = !filters.technicalRating || tool['Technical Rating'] === filters.technicalRating;
    const matchesPlatform = filters.platform.length === 0 || 
      filters.platform.some(platform => 
        tool['Platform'] && tool['Platform'].split(/[,;]+/).some(p => p.trim() === platform)
      );
    
    return matchesQuery && matchesPricing && matchesTechnicalRating && matchesPlatform;
  });

  // Split into starred and non-starred tools
  const starredTools = filtered.filter(tool => starredIds.includes(tool.id));
  const regularTools = filtered.filter(tool => !starredIds.includes(tool.id));

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <header className="mb-8 text-center">
          <div className="flex justify-center items-center gap-4 mb-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ color: '#230E77' }}>
              Refold Tool Library
            </h1>
            
            <div className="flex items-center gap-2">
              {/* Intro/Help modal */}
              <IntroModal showInitially={true} />
              
              {/* General feedback button - larger and more visible */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open('https://form.typeform.com/to/JvsO9bHi', '_blank');
                }}
                className="px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center gap-2 bg-gray-100 border border-gray-300"
                style={{ color: '#6B7280' }}
                title="General feedback"
              >
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span className="text-sm font-medium">Give Feedback</span>
              </button>
            </div>
          </div>
          
          <p className="mt-2 text-sm sm:text-base font-roboto text-gray-600">
            {loading ? 'Loading tool data...' : `Loaded ${tools.length} tools`}
            {starredLoaded && starredIds.length > 0 && ` • ${starredIds.length} starred`}
          </p>
        </header>

        <div className="flex flex-col gap-4 mb-8">
          <input 
            type="text" 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="Search tools..." 
            className="w-full px-4 py-3 border-2 rounded-lg bg-white shadow-sm text-base focus:ring-2 focus:ring-opacity-50 text-gray-800"
            style={{ 
              borderColor: '#D1D5DB'
            }}
            onFocus={(e) => e.target.style.borderColor = '#F97316'}
            onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
          />
        </div>
        
        {tools.length > 0 && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border" style={{ borderColor: '#D1D5DB' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
              <div>
                <label className="block text-sm font-medium mb-1 font-roboto text-gray-700">Platform</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {getUniquePlatforms().map(platform => (
                    <label key={platform} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.platform.includes(platform)}
                        onChange={() => togglePlatformFilter(platform)}
                        className="mr-2 rounded"
                        style={{ accentColor: '#F97316' }}
                      />
                      <span className="text-sm text-gray-700">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 font-roboto text-gray-700">Pricing</label>
                <select 
                  value={filters.pricing} 
                  onChange={e => setFilters(prev => ({...prev, pricing: e.target.value}))}
                  className="w-full px-3 py-2 border rounded bg-white shadow-sm text-sm focus:ring-2 text-gray-800"
                  style={{ 
                    borderColor: '#D1D5DB'
                  }}
                >
                  <option value="">All Pricing</option>
                  {getUniqueOptions('Pricing').map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 font-roboto text-gray-700">Technical Rating</label>
                <select 
                  value={filters.technicalRating} 
                  onChange={e => setFilters(prev => ({...prev, technicalRating: e.target.value}))}
                  className="w-full px-3 py-2 border rounded bg-white shadow-sm text-sm focus:ring-2 text-gray-800"
                  style={{ 
                    borderColor: '#D1D5DB'
                  }}
                >
                  <option value="">All Ratings</option>
                  {getUniqueOptions('Technical Rating').map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div className="sm:col-span-2 lg:col-span-2 flex items-end">
                <button 
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm border rounded hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 bg-white"
                  style={{ 
                    color: '#F97316',
                    borderColor: '#F97316'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F97316'
                    e.currentTarget.style.color = '#FFFFFE'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFE'
                    e.currentTarget.style.color = '#F97316'
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
            
            <div className="mt-3 text-sm font-roboto text-gray-600">
              Showing {filtered.length} of {tools.length} tools
              {starredTools.length > 0 && ` (${starredTools.length} starred)`}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Starred Tools Section */}
          {starredTools.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  style={{ color: '#F59E0B' }}
                >
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                </svg>
                <h2 className="text-xl font-extrabold" style={{ color: '#230E77' }}>
                  Starred Tools ({starredTools.length})
                </h2>
              </div>
              <div className="space-y-6">
                {starredTools.map((tool) => (
                  <Card 
                    key={`starred-${tool.id}`} 
                    tool={tool} 
                    isOpen={expandedCards.has(tool.id)}
                    onToggle={toggleCard}
                    tools={tools}
                  />
                ))}
              </div>
              
              {regularTools.length > 0 && (
                <div className="my-8">
                  <hr className="border-gray-300" />
                </div>
              )}
            </div>
          )}

          {/* Regular Tools Section */}
          {regularTools.length > 0 && (
            <div>
              {starredTools.length > 0 && (
                <h2 className="text-xl font-extrabold mb-4" style={{ color: '#230E77' }}>
                  All Tools ({regularTools.length})
                </h2>
              )}
              <div className="space-y-6">
                {regularTools.map((tool) => (
                  <Card 
                    key={`regular-${tool.id}`} 
                    tool={tool} 
                    isOpen={expandedCards.has(tool.id)}
                    onToggle={toggleCard}
                    tools={tools}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2 z-50"
          style={{ 
            backgroundColor: '#F97316',
            color: '#FFFFFE'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EA580C'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F97316'}
          title="Scroll to top"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="18,15 12,9 6,15"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
}