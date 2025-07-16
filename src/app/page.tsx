'use client';

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import FeedbackButton from '../components/FeedbackButton';
import IntroModal from '../components/IntroModal';
import ActivityLink from '../components/ActivityLink';
import { useStarredActivities } from '../contexts/StarredContext';

interface Activity {
  [key: string]: string;
}

interface Tool {
  [key: string]: string;
}

interface FormattedTextProps {
  children?: string;
  activities?: Activity[];
  tools?: Tool[];
  currentActivityId?: string;
}

const GUIDE_SECTIONS = [
  'Written Guide - Intro',
  'Written Guide - Health Routine',
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

const FormattedText = ({ children, activities = [], tools = [], currentActivityId }: FormattedTextProps) => {
  if (!children) return null;
  
  // Build activity lookup structures
  const activityMap = new Map<string, Activity>();
  const sortedActivityNames: string[] = [];
  
  if (activities.length > 0) {
    activities.forEach(activity => {
      const displayName = activity['Display Name'] || activity['code name'];
      if (displayName && activity.id !== currentActivityId && displayName.toLowerCase() !== 'other') {
        activityMap.set(displayName.toLowerCase(), activity);
        sortedActivityNames.push(displayName);
      }
    });
    
    // Sort by length (longest first) for proper matching
    sortedActivityNames.sort((a, b) => b.length - a.length);
  }

  // Build tool lookup structures
  const toolMap = new Map<string, Tool>();
  const sortedToolNames: string[] = [];
  
  if (tools.length > 0) {
    tools.forEach(tool => {
      const displayName = tool['Display Name'] || tool['code name'];
      if (displayName && displayName.toLowerCase() !== 'other') {
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
  
  const processActivityLinks = (text: string): (string | React.JSX.Element)[] => {
    if (sortedActivityNames.length === 0) {
      return [text];
    }
    
    let result: (string | React.JSX.Element)[] = [text];
    
    sortedActivityNames.forEach((activityName, index) => {
      const newResult: (string | React.JSX.Element)[] = [];
      
      result.forEach((item) => {
        if (typeof item === 'string') {
          const regex = new RegExp(`\\b${escapeRegex(activityName)}\\b`, 'gi');
          const parts = item.split(regex);
          const matches = item.match(regex) || [];
          
          for (let i = 0; i < parts.length; i++) {
            if (parts[i]) {
              newResult.push(parts[i]);
            }
            if (i < matches.length) {
              const activity = activityMap.get(activityName.toLowerCase());
              if (activity) {
                newResult.push(
                  <ActivityLink key={`activity-${activity.id}-${index}-${i}`} activity={activity}>
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
                  <ActivityLink key={`tool-${tool.id}-${index}-${i}`} activity={tool}>
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
    // First process activity links, then tool links
    const withActivityLinks = processActivityLinks(text);
    
    // Process tool links on the result
    const finalProcessed: (string | React.JSX.Element)[] = [];
    
    withActivityLinks.forEach((item) => {
      if (typeof item === 'string') {
        const withToolLinks = processToolLinks(item);
        finalProcessed.push(...withToolLinks);
      } else {
        finalProcessed.push(item);
      }
    });
    
    // Then process URL links on string parts only
    const finalResult: (string | React.JSX.Element)[] = [];
    
    finalProcessed.forEach((item, itemIndex) => {
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
                style={{ color: '#6544E9' }}
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

const TipsSection = ({ content, activities = [], tools = [], currentActivityId }: { 
  content?: string; 
  activities?: Activity[];
  tools?: Tool[];
  currentActivityId?: string;
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
          border: `2px solid #6544E9`
        }}
        onClick={toggleTips}
      >
        <h4 className="font-extrabold flex items-center gap-2" style={{ color: '#6544E9' }}>
          <span className={`transform transition-transform ${tipsOpen ? 'rotate-90' : ''}`}>▶</span>
          Tips and Tricks 🎯🧠
        </h4>
      </button>
      {tipsOpen && (
        <div className="mt-2 ml-6">
          <FormattedText activities={activities} tools={tools} currentActivityId={currentActivityId}>{content}</FormattedText>
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
          border: `2px solid #6544E9`
        }}
        onClick={toggleDemo}
      >
        <h4 className="font-extrabold flex items-center gap-2" style={{ color: '#6544E9' }}>
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

// Tool tooltip component
const ToolTooltip = ({ tool, children }: { tool: Tool; children: React.ReactNode }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/tool/${tool.id}`, '_blank');
  };

  return (
    <span className="relative inline-block">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="px-2 py-1 rounded-full text-xs font-medium font-roboto cursor-pointer transition-all duration-200 hover:shadow-md"
        style={{ backgroundColor: '#F97316', color: '#FFFFFE' }}
      >
        {children}
      </button>
      
      {showTooltip && (
        <div 
          className="absolute z-50 p-3 bg-white border rounded-lg shadow-xl w-80 -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full"
          style={{ borderColor: '#D1D5DB' }}
        >
          {/* Tooltip arrow */}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid white'
            }}
          />
          
          <div className="space-y-2">
            <h4 className="font-bold text-sm" style={{ color: '#230E77' }}>
              {tool['Display Name'] || tool['code name']}
            </h4>
            
            <p className="text-xs text-gray-700 leading-relaxed">
              {tool['Short Description']}
            </p>
            
            <div className="flex flex-wrap gap-1">
              {tool['Type'] && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#F97316', color: '#FFFFFE' }}>
                  {tool['Type']}
                </span>
              )}
              {tool['Pillar'] && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#FDBA74', color: '#230E77' }}>
                  {tool['Pillar']}
                </span>
              )}
            </div>
            
            <p className="text-xs text-gray-500 italic">
              Click to see tool details
            </p>
          </div>
        </div>
      )}
    </span>
  );
};

interface CardProps {
  act: Activity;
  isOpen: boolean;
  onToggle: (activityId: string) => void;
  cardRef?: (el: HTMLDivElement | null) => void;
  activities: Activity[];
  tools: Tool[];
}

const Card = ({ act, isOpen, onToggle, cardRef, activities, tools }: CardProps) => {
  const { isStarred, toggleStar } = useStarredActivities();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on the external link icon, feedback button, or star button
    if ((e.target as HTMLElement).closest('.external-link-icon') || 
        (e.target as HTMLElement).closest('button')) {
      return;
    }
    onToggle(act.id);
  };

  const handleMiddleClick = (e: React.MouseEvent) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      window.open(`/activity/${act.id}`, '_blank');
    }
  };

  const handleExternalLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/activity/${act.id}`, '_blank');
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If this card is currently open and we're starring it, we'll need to follow it
    const wasStarred = isStarred(act.id);
    const willBeStarred = !wasStarred;
    
    // Toggle the star
    toggleStar(act.id);
    
    // If card is open and moving to starred section, we'll scroll to it after re-render
    if (isOpen && willBeStarred) {
      // Use a short timeout to allow React to re-render the moved card
      setTimeout(() => {
        const starredCard = document.querySelector(`[data-activity-id="${act.id}"]`);
        if (starredCard) {
          starredCard.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
    }
  };
  
  const whyUrl = getEmbedUrl(act['Video What and why']);
  const demoUrl = getEmbedUrl(act['Video Demo']);

  // Get tools for this activity
  const activityTools = act['Tools'] ? 
    act['Tools'].split(/;+/).map(toolName => {
      const trimmed = toolName.trim();
      return tools.find(tool => 
        (tool['Display Name'] && tool['Display Name'].toLowerCase() === trimmed.toLowerCase()) ||
        (tool['code name'] && tool['code name'].toLowerCase() === trimmed.toLowerCase())
      );
    }).filter((tool): tool is Tool => tool !== undefined) : [];

  return (
    <div 
      ref={cardRef}
      data-activity-id={act.id}
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
            color: isStarred(act.id) ? '#F59E0B' : '#9CA3AF'
          }}
          title={isStarred(act.id) ? 'Remove from starred' : 'Add to starred'}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill={isStarred(act.id) ? 'currentColor' : 'none'}
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
            color: '#6544E9'
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

      {/* Activity feedback button */}
      <div className="absolute bottom-3 right-3 z-10">
        <FeedbackButton 
          type="activity" 
          activityId={act.id} 
          activityName={act['Display Name'] || act['code name']}
        />
      </div>

      <header className="p-4 sm:p-6 border-b space-y-2" style={{ borderColor: '#D1D5DB' }}>
        <h2 className="text-xl sm:text-2xl font-extrabold break-words pr-8" style={{ color: '#230E77' }}>
          {act['Display Name'] || act['code name']}
        </h2>
        <pre className="text-sm whitespace-pre-wrap break-words text-gray-700">
          {act['Short Description']}
        </pre>
        <p className="text-xs font-roboto text-gray-400">
          ID: {act['id']} &middot; Code: {act['code name']}
        </p>
      </header>

      <div className="p-4 sm:p-6 space-y-4 pb-12">
        <div className="flex flex-wrap gap-2">
          {act['Type'] && (
            <span className="px-2 py-1 rounded-full text-xs font-medium font-roboto" style={{ backgroundColor: '#F3CE5B', color: '#230E77' }}>
              {act['Type']}
            </span>
          )}
          {act['Pillar'] && (
            <span className="px-2 py-1 rounded-full text-xs font-medium font-roboto" style={{ backgroundColor: '#6544E9', color: '#FFFFFE' }}>
              {act['Pillar']}
            </span>
          )}
          {act['Refold Phase(s)'] && act['Refold Phase(s)'].split(/;+/).map((p, i) => (
            <span key={i} className="px-2 py-1 rounded-full text-xs font-medium font-roboto" style={{ backgroundColor: '#BFB2F6', color: '#230E77' }}>
              Phase {p.trim()}
            </span>
          ))}
        </div>

        {/* Tools section */}
        {activityTools.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Recommended Tools:</div>
            <div className="flex flex-wrap gap-2">
              {activityTools.map((tool, i) => (
                <ToolTooltip key={i} tool={tool}>
                  {tool['Display Name'] || tool['code name']}
                </ToolTooltip>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 text-sm text-gray-600">
          {act['Parent Skills'] && (
            <div className="break-words">
              <strong>Parent Skills:</strong> {act['Parent Skills']}
            </div>
          )}
          {act['Child Techniques'] && act['Child Techniques'] !== '#N/A' && (
            <div className="break-words">
              <strong>Child Techniques:</strong> {act['Child Techniques']}
            </div>
          )}
          {act['Parent Categories'] && (
            <div className="break-words">
              <strong>Parent Categories:</strong> {act['Parent Categories'].split(/;+/).map(cat => cat.trim()).filter(Boolean).join(', ')}
            </div>
          )}
          {act['Alternatives'] && (
            <div className="break-words">
              <strong>Alternatives:</strong> {act['Alternatives']}
            </div>
          )}
          {act['Sub-techniques'] && (
            <div className="break-words">
              <strong>Sub-techniques:</strong> {act['Sub-techniques']}
            </div>
          )}
        </div>

        {act['Aliases'] && (
          <p className="italic text-sm break-words font-roboto text-gray-600">
            {act['Aliases']
              .split(/\r?\n|; ?/)
              .map(a => a.trim().replace(/^[-–—]\s*/, ''))
              .filter(Boolean)
              .join(', ')}
          </p>
        )}
      </div>

      {isOpen && (
        <div className="p-4 sm:p-6 bg-gray-50 space-y-6">
          <FormattedText activities={activities} tools={tools} currentActivityId={act.id}>{act['Long Description']}</FormattedText>
          {(whyUrl || demoUrl) && (
            <div className="space-y-6">
              {whyUrl && <Video title="What & Why" src={whyUrl} />}
              <DemoSection demoUrl={demoUrl || undefined} />
            </div>
          )}
          {act['Benefits'] && (
            <div>
              <strong style={{ color: '#230E77' }}>Benefits:</strong>
              <ul className="list-disc list-inside mt-1 text-gray-700">
                {act['Benefits'].split(/;+/).map((b, i) => (
                  <li key={i}>{b.trim()}</li>
                ))}
              </ul>
              <hr className="mt-6 border-gray-300" />
            </div>
          )}
          {GUIDE_SECTIONS.map(sec => act[sec] && (
            <div key={sec}>
              <h4 className="font-extrabold" style={{ color: '#230E77' }}>
                {sec.replace('Written Guide - ','')
                   .replace('Health Routine', 'How this fits into a healthy learning routine')
                   .replace('Intro', `${act['Display Name'] || act['code name']} Walkthrough`)
                   .replace('Issues', 'Common issues and questions')}
              </h4>
              <FormattedText activities={activities} tools={tools} currentActivityId={act.id}>{act[sec]}</FormattedText>
            </div>
          ))}
          <TipsSection content={act['Written Guide - Tips and Tricks']} activities={activities} tools={tools} currentActivityId={act.id} />
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    pillar: '',
    phase: '',
    parentSkill: ''
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

  const toggleCard = (activityId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
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
              const o: Activity | Tool = {};
              Object.entries(r).forEach(([k, v]) => {
                o[k] = typeof v === 'string' ? v.replace(/\r/g, '').replace(/⏎/g, '\n').trim() : v as string;
              });
              return o;
            });
            
            // Separate activities and tools
            const activitiesOnly = cleaned.filter(item => item.Library === 'Activities') as Activity[];
            const toolsOnly = cleaned.filter(item => item.Library === 'Tools') as Tool[];
            
            // Sort by ID (convert to number for proper sorting)
            const sortedActivities = activitiesOnly.sort((a, b) => {
              const idA = parseInt(a.id) || 0;
              const idB = parseInt(b.id) || 0;
              return idA - idB;
            });

            const sortedTools = toolsOnly.sort((a, b) => {
              const idA = parseInt(a.id) || 0;
              const idB = parseInt(b.id) || 0;
              return idA - idB;
            });
            
            setActivities(sortedActivities);
            setTools(sortedTools);
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
    activities.forEach(act => {
      const value = act[field];
      if (value) {
        if (field === 'Refold Phase(s)') {
          value.split(/;+/).forEach(phase => {
            const trimmed = phase.trim();
            if (trimmed) values.add(trimmed);
          });
        } else if (field === 'Parent Skills') {
          value.split(/[;,]+/).forEach(skill => {
            const trimmed = skill.trim();
            if (trimmed) values.add(trimmed);
          });
        } else {
          values.add(value.trim());
        }
      }
    });
    return Array.from(values).sort();
  };

  const clearFilters = () => {
    setFilters({ pillar: '', phase: '', parentSkill: '' });
  };

  const filtered = activities.filter(a => {
    const matchesQuery = Object.values(a).join(' ').toLowerCase().includes(query.toLowerCase());
    const matchesPillar = !filters.pillar || a['Pillar'] === filters.pillar;
    const matchesPhase = !filters.phase || 
      (a['Refold Phase(s)'] && a['Refold Phase(s)'].split(/;+/).some(phase => phase.trim() === filters.phase));
    const matchesParentSkill = !filters.parentSkill || 
      (a['Parent Skills'] && a['Parent Skills'].split(/[;,]+/).some(skill => skill.trim() === filters.parentSkill));
    
    return matchesQuery && matchesPillar && matchesPhase && matchesParentSkill;
  });

  // Split into starred and non-starred activities
  const starredActivities = filtered.filter(a => starredIds.includes(a.id));
  const regularActivities = filtered.filter(a => !starredIds.includes(a.id));

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <header className="mb-8 text-center">
          <div className="flex justify-center items-center gap-4 mb-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ color: '#230E77' }}>
              Refold Activity Library
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
            {loading ? 'Loading activity data...' : `Loaded ${activities.length} activities`}
            {starredLoaded && starredIds.length > 0 && ` • ${starredIds.length} starred`}
          </p>
        </header>

        <div className="flex flex-col gap-4 mb-8">
          <input 
            type="text" 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="Search activities..." 
            className="w-full px-4 py-3 border-2 rounded-lg bg-white shadow-sm text-base focus:ring-2 focus:ring-opacity-50 text-gray-800"
            style={{ 
              borderColor: '#D1D5DB'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6544E9'}
            onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
          />
        </div>
        
        {activities.length > 0 && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border" style={{ borderColor: '#D1D5DB' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-1 font-roboto text-gray-700">Pillar</label>
                <select 
                  value={filters.pillar} 
                  onChange={e => setFilters(prev => ({...prev, pillar: e.target.value}))}
                  className="w-full px-3 py-2 border rounded bg-white shadow-sm text-sm focus:ring-2 text-gray-800"
                  style={{ 
                    borderColor: '#D1D5DB'
                  }}
                >
                  <option value="">All Pillars</option>
                  {getUniqueOptions('Pillar').map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 font-roboto text-gray-700">Phase</label>
                <select 
                  value={filters.phase} 
                  onChange={e => setFilters(prev => ({...prev, phase: e.target.value}))}
                  className="w-full px-3 py-2 border rounded bg-white shadow-sm text-sm focus:ring-2 text-gray-800"
                  style={{ 
                    borderColor: '#D1D5DB'
                  }}
                >
                  <option value="">All Phases</option>
                  {getUniqueOptions('Refold Phase(s)').map(option => (
                    <option key={option} value={option}>Phase {option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 font-roboto text-gray-700">Parent Skill</label>
                <select 
                  value={filters.parentSkill} 
                  onChange={e => setFilters(prev => ({...prev, parentSkill: e.target.value}))}
                  className="w-full px-3 py-2 border rounded bg-white shadow-sm text-sm focus:ring-2 text-gray-800"
                  style={{ 
                    borderColor: '#D1D5DB'
                  }}
                >
                  <option value="">All Parent Skills</option>
                  {getUniqueOptions('Parent Skills').map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={clearFilters}
                className="px-4 py-2 text-sm border rounded hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 bg-white"
                style={{ 
                  color: '#6544E9',
                  borderColor: '#6544E9'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#6544E9'
                  e.currentTarget.style.color = '#FFFFFE'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFE'
                  e.currentTarget.style.color = '#6544E9'
                }}
              >
                Clear Filters
              </button>
            </div>
            
            <div className="mt-3 text-sm font-roboto text-gray-600">
              Showing {filtered.length} of {activities.length} activities
              {starredActivities.length > 0 && ` (${starredActivities.length} starred)`}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Starred Activities Section */}
          {starredActivities.length > 0 && (
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
                  Starred Activities ({starredActivities.length})
                </h2>
              </div>
              <div className="space-y-6">
                {starredActivities.map((a) => (
                  <Card 
                    key={`starred-${a.id}`} 
                    act={a} 
                    isOpen={expandedCards.has(a.id)}
                    onToggle={toggleCard}
                    activities={activities}
                    tools={tools}
                  />
                ))}
              </div>
              
              {regularActivities.length > 0 && (
                <div className="my-8">
                  <hr className="border-gray-300" />
                </div>
              )}
            </div>
          )}

          {/* Regular Activities Section */}
          {regularActivities.length > 0 && (
            <div>
              {starredActivities.length > 0 && (
                <h2 className="text-xl font-extrabold mb-4" style={{ color: '#230E77' }}>
                  All Activities ({regularActivities.length})
                </h2>
              )}
              <div className="space-y-6">
                {regularActivities.map((a) => (
                  <Card 
                    key={`regular-${a.id}`} 
                    act={a} 
                    isOpen={expandedCards.has(a.id)}
                    onToggle={toggleCard}
                    activities={activities}
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
            backgroundColor: '#6544E9',
            color: '#FFFFFE'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#230E77'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6544E9'}
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