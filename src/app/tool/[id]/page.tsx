'use client';

import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import Link from 'next/link';
import FeedbackButton from '../../../components/FeedbackButton';
import StarButton from '../../../components/StarButton';
import ActivityLink from '../../../components/ActivityLink';

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

const PRICING_EXPLANATIONS = {
  'Free': 'Completely free to use',
  'Cosmetics': 'Features are free, but small tweaks and customization is paid (colors, cloud syncing, ad removal)',
  'Freemium': 'There is a free tier which has features, but you must pay to access additional features',
  'Paid': 'Access to the tool is paid, either one time or with a subscription. Many paid tools have free trials'
};

const TECH_LEVEL_EXPLANATIONS = {
  '1': 'No experience required. There is minimal set up, and it\'s very user-friendly (simple apps or web pages).',
  '2': 'Purpose built tool with learning curve. Using the tool is generally simple, but might require learning or some customization.',
  '3': 'User friendly, but requires setup and learning. Still approachable for most people, but will require effort to learn and set up.',
  '4': 'Slightly technical. Using the tool might require tinkering, special knowledge or a non-standard setup.',
  '5': 'Very technical. Using and installing the tool might require technical experience and troubleshooting.'
};

// Helper function to parse markdown links
const parseMarkdownLink = (text: string): { displayText: string; url: string } => {
  // Check for markdown link format: [Display Text](https://example.com)
  const markdownLinkRegex = /^\[([^\]]+)\]\(([^)]+)\)$/;
  const match = text.match(markdownLinkRegex);
  
  if (match) {
    return {
      displayText: match[1],
      url: match[2]
    };
  }
  
  // If no markdown format found, treat as regular URL
  return {
    displayText: text,
    url: text
  };
};

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

// Tooltip component for badges with side positioning
const TooltipBadge = ({ 
  children, 
  tooltip, 
  backgroundColor, 
  textColor 
}: { 
  children: React.ReactNode; 
  tooltip: string; 
  backgroundColor: string; 
  textColor: string; 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<'left' | 'right'>('right');

  useEffect(() => {
    if (showTooltip && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipWidth = 320;
      const viewportWidth = window.innerWidth;
      const margin = 16;

      // Check if there's room on the right, otherwise go left
      if (triggerRect.right + tooltipWidth + margin > viewportWidth) {
        setPosition('left');
      } else {
        setPosition('right');
      }
    }
  }, [showTooltip]);

  return (
    <span className="relative inline-block" ref={triggerRef}>
      <span 
        className="px-2 py-1 rounded-full text-xs font-medium font-roboto cursor-help" 
        style={{ backgroundColor, color: textColor }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </span>
      
      {showTooltip && (
        <div 
          className={`absolute z-50 p-3 bg-white border rounded-lg shadow-xl w-80 top-0 ${
            position === 'right' ? 'left-full ml-2' : 'right-full mr-2'
          }`}
          style={{ borderColor: '#D1D5DB' }}
        >
          {/* Arrow pointing to the trigger */}
          <div 
            className={`absolute top-2 w-0 h-0 ${
              position === 'right' ? '-left-1' : '-right-1'
            }`}
            style={{
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              [position === 'right' ? 'borderRight' : 'borderLeft']: '6px solid white'
            }}
          />
          <div className="text-sm text-gray-700">
            {tooltip}
          </div>
        </div>
      )}
    </span>
  );
};

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

// Inline version for alternatives that don't break to new lines
const FormattedInlineText = ({ children, tools = [], currentToolId }: FormattedTextProps) => {
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
  
  // For inline text, just process the links without wrapping in divs
  return <span>{formatTextWithLinks(children)}</span>;
};

const TipsSection = ({ content, tools = [], currentToolId }: { 
  content?: string; 
  tools?: Tool[];
  currentToolId?: string;
}) => {
  const [tipsOpen, setTipsOpen] = useState(false);
  
  const toggleTips = () => {
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
  
  const toggleDemo = () => {
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

const CopyUrlButton = () => {
  const [copied, setCopied] = useState(false);
  
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <button
      onClick={copyUrl}
      className="px-4 py-2 text-sm border rounded-lg hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 bg-white flex items-center gap-2"
      style={{ 
        color: copied ? '#10B981' : '#F97316',
        borderColor: copied ? '#10B981' : '#F97316'
      }}
    >
      {copied ? (
        <>
          <span>✓</span>
          Copied!
        </>
      ) : (
        <>
          <span>📋</span>
          Copy URL
        </>
      )}
    </button>
  );
};

export default function ToolPage({ params }: { params: Promise<{ id: string }> }) {
  const [tool, setTool] = useState<Tool | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toolId, setToolId] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setToolId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (!toolId) return;
    
    const loadTool = async () => {
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
            
            // Sort tools by ID for consistency
            const sorted = toolsOnly.sort((a, b) => {
              const idA = parseInt(a.id) || 0;
              const idB = parseInt(b.id) || 0;
              return idA - idB;
            });
            
            setTools(sorted);
            
            const foundTool = sorted.find(t => t.id === toolId);
            if (foundTool) {
              setTool(foundTool);
            } else {
              setNotFound(true);
            }
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading tool:', error);
        setNotFound(true);
        setLoading(false);
      }
    };
    
    loadTool();
  }, [toolId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#F97316' }}></div>
          <p className="text-gray-600">Loading tool...</p>
        </div>
      </div>
    );
  }

  if (notFound || !tool) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold mb-4" style={{ color: '#230E77' }}>Tool Not Found</h1>
          <p className="text-gray-600 mb-6">The tool with ID &quot;{toolId}&quot; could not be found.</p>
          <Link 
            href="/tools" 
            className="px-4 py-2 rounded-lg transition-colors duration-200"
            style={{ backgroundColor: '#F97316', color: '#FFFFFE' }}
          >
            ← Back to Tool Library
          </Link>
        </div>
      </div>
    );
  }

  const whyUrl = getEmbedUrl(tool['Video What and why']);
  const demoUrl = getEmbedUrl(tool['Video Demo']);

  // Parse markdown link for tool URL
  const toolLinkData = tool['Tools'] ? parseMarkdownLink(tool['Tools']) : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header with navigation */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link 
            href="/tools" 
            className="text-sm flex items-center gap-2 hover:underline"
            style={{ color: '#F97316' }}
          >
            ← Back to Tool Library
          </Link>
          <CopyUrlButton />
        </div>

        {/* Tool Card */}
        <div className="bg-white rounded-xl shadow-lg relative">
          {/* Top right buttons */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1">
            <StarButton activityId={tool.id} size="medium" />
            <FeedbackButton 
              type="activity" 
              activityId={tool.id} 
              activityName={tool['Display Name'] || tool['code name']}
              size="medium"
              className="bg-white shadow-sm border border-gray-200"
            />
          </div>

          <header className="p-4 sm:p-6 border-b space-y-2 pr-20" style={{ borderColor: '#D1D5DB' }}>
            <h1 className="text-2xl sm:text-3xl font-extrabold break-words" style={{ color: '#230E77' }}>
              {tool['Display Name'] || tool['code name']}
            </h1>
            <pre className="text-sm whitespace-pre-wrap break-words text-gray-700">
              {tool['Short Description']}
            </pre>
            <p className="text-xs font-roboto text-gray-400">
              ID: {tool['id']} &middot; Code: {tool['code name']}
            </p>
          </header>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {tool['Type'] && (
                <span className="px-2 py-1 rounded-full text-xs font-medium font-roboto" style={{ backgroundColor: '#F97316', color: '#FFFFFE' }}>
                  {tool['Type']}
                </span>
              )}
              {tool['Pillar'] && (
                <TooltipBadge
                  tooltip={PRICING_EXPLANATIONS[tool['Pillar'] as keyof typeof PRICING_EXPLANATIONS] || tool['Pillar']}
                  backgroundColor="#FDBA74"
                  textColor="#230E77"
                >
                  {tool['Pillar']}
                </TooltipBadge>
              )}
              {tool['Refold Phase(s)'] && (
                <TooltipBadge
                  tooltip={TECH_LEVEL_EXPLANATIONS[tool['Refold Phase(s)'] as keyof typeof TECH_LEVEL_EXPLANATIONS] || `Tech Level: ${tool['Refold Phase(s)']}`}
                  backgroundColor="#FED7AA"
                  textColor="#230E77"
                >
                  Tech Level: {tool['Refold Phase(s)']}
                </TooltipBadge>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm text-gray-600">
              {tool['parent skills cat'] && (
                <div className="break-words">
                  <strong>Skills:</strong> {tool['parent skills cat']}
                </div>
              )}
              {tool['Alternatives'] && (
                <div className="break-words">
                  <strong>Alternatives:</strong> <FormattedInlineText tools={tools} currentToolId={tool.id}>{tool['Alternatives']}</FormattedInlineText>
                </div>
              )}
              {toolLinkData && (
                <div className="break-words">
                  <strong>Get the tool:</strong> 
                  <a 
                    href={toolLinkData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 underline hover:no-underline"
                    style={{ color: '#F97316' }}
                  >
                    {toolLinkData.displayText}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Expanded content */}
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
        </div>
      </div>
    </div>
  );
}