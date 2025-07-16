'use client';

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import Link from 'next/link';
import FeedbackButton from '../../../components/FeedbackButton';
import StarButton from '../../../components/StarButton';
import ActivityLink from '../../../components/ActivityLink';

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
  
  const toggleTips = () => {
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
  
  const toggleDemo = () => {
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
        color: copied ? '#10B981' : '#6544E9',
        borderColor: copied ? '#10B981' : '#6544E9'
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

export default function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activityId, setActivityId] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setActivityId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (!activityId) return;
    
    const loadActivity = async () => {
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
            
            // Sort by ID for consistency
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
            
            const foundActivity = sortedActivities.find(act => act.id === activityId);
            if (foundActivity) {
              setActivity(foundActivity);
            } else {
              setNotFound(true);
            }
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading activity:', error);
        setNotFound(true);
        setLoading(false);
      }
    };
    
    loadActivity();
  }, [activityId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#6544E9' }}></div>
          <p className="text-gray-600">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (notFound || !activity) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold mb-4" style={{ color: '#230E77' }}>Activity Not Found</h1>
          <p className="text-gray-600 mb-6">The activity with ID &quot;{activityId}&quot; could not be found.</p>
          <Link 
            href="/" 
            className="px-4 py-2 rounded-lg transition-colors duration-200"
            style={{ backgroundColor: '#6544E9', color: '#FFFFFE' }}
          >
            ← Back to Activity Library
          </Link>
        </div>
      </div>
    );
  }

  const whyUrl = getEmbedUrl(activity['Video What and why']);
  const demoUrl = getEmbedUrl(activity['Video Demo']);

  // Get tools for this activity
  const activityTools = activity['Tools'] ? 
    activity['Tools'].split(/;+/).map(toolName => {
      const trimmed = toolName.trim();
      return tools.find(tool => 
        (tool['Display Name'] && tool['Display Name'].toLowerCase() === trimmed.toLowerCase()) ||
        (tool['code name'] && tool['code name'].toLowerCase() === trimmed.toLowerCase())
      );
    }).filter((tool): tool is Tool => tool !== undefined) : [];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header with navigation */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link 
            href="/" 
            className="text-sm flex items-center gap-2 hover:underline"
            style={{ color: '#6544E9' }}
          >
            ← Back to Activity Library
          </Link>
          <CopyUrlButton />
        </div>

        {/* Activity Card */}
        <div className="bg-white rounded-xl shadow-lg relative">
          {/* Top right buttons */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1">
            <StarButton activityId={activity.id} size="medium" />
            <FeedbackButton 
              type="activity" 
              activityId={activity.id} 
              activityName={activity['Display Name'] || activity['code name']}
              size="medium"
              className="bg-white shadow-sm border border-gray-200"
            />
          </div>

          <header className="p-4 sm:p-6 border-b space-y-2 pr-20" style={{ borderColor: '#D1D5DB' }}>
            <h1 className="text-2xl sm:text-3xl font-extrabold break-words" style={{ color: '#230E77' }}>
              {activity['Display Name'] || activity['code name']}
            </h1>
            <pre className="text-sm whitespace-pre-wrap break-words text-gray-700">
              {activity['Short Description']}
            </pre>
            <p className="text-xs font-roboto text-gray-400">
              ID: {activity['id']} &middot; Code: {activity['code name']}
            </p>
          </header>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {activity['Type'] && (
                <span className="px-2 py-1 rounded-full text-xs font-medium font-roboto" style={{ backgroundColor: '#F3CE5B', color: '#230E77' }}>
                  {activity['Type']}
                </span>
              )}
              {activity['Pillar'] && (
                <span className="px-2 py-1 rounded-full text-xs font-medium font-roboto" style={{ backgroundColor: '#6544E9', color: '#FFFFFE' }}>
                  {activity['Pillar']}
                </span>
              )}
              {activity['Refold Phase(s)'] && activity['Refold Phase(s)'].split(/;+/).map((p, i) => (
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
              {activity['Parent Skills'] && (
                <div className="break-words">
                  <strong>Parent Skills:</strong> {activity['Parent Skills']}
                </div>
              )}
              {activity['Child Techniques'] && activity['Child Techniques'] !== '#N/A' && (
                <div className="break-words">
                  <strong>Child Techniques:</strong> {activity['Child Techniques']}
                </div>
              )}
              {activity['Parent Categories'] && (
                <div className="break-words">
                  <strong>Parent Categories:</strong> {activity['Parent Categories'].split(/;+/).map(cat => cat.trim()).filter(Boolean).join(', ')}
                </div>
              )}
              {activity['Alternatives'] && (
                <div className="break-words">
                  <strong>Alternatives:</strong> {activity['Alternatives']}
                </div>
              )}
              {activity['Sub-techniques'] && (
                <div className="break-words">
                  <strong>Sub-techniques:</strong> {activity['Sub-techniques']}
                </div>
              )}
            </div>

            {activity['Aliases'] && (
              <p className="italic text-sm break-words font-roboto text-gray-600">
                {activity['Aliases']
                  .split(/\r?\n|; ?/)
                  .map(a => a.trim().replace(/^[-–—]\s*/, ''))
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </div>

          {/* Expanded content */}
          <div className="p-4 sm:p-6 bg-gray-50 space-y-6">
            <FormattedText activities={activities} tools={tools} currentActivityId={activity.id}>{activity['Long Description']}</FormattedText>
            {(whyUrl || demoUrl) && (
              <div className="space-y-6">
                {whyUrl && <Video title="What & Why" src={whyUrl} />}
                <DemoSection demoUrl={demoUrl || undefined} />
              </div>
            )}
            {activity['Benefits'] && (
              <div>
                <strong style={{ color: '#230E77' }}>Benefits:</strong>
                <ul className="list-disc list-inside mt-1 text-gray-700">
                  {activity['Benefits'].split(/;+/).map((b, i) => (
                    <li key={i}>{b.trim()}</li>
                  ))}
                </ul>
                <hr className="mt-6 border-gray-300" />
              </div>
            )}
            {GUIDE_SECTIONS.map(sec => activity[sec] && (
              <div key={sec}>
                <h4 className="font-extrabold" style={{ color: '#230E77' }}>
                  {sec.replace('Written Guide - ','')
                     .replace('Health Routine', 'How this fits into a healthy learning routine')
                     .replace('Intro', `${activity['Display Name'] || activity['code name']} Walkthrough`)
                     .replace('Issues', 'Common issues and questions')}
                </h4>
                <FormattedText activities={activities} tools={tools} currentActivityId={activity.id}>{activity[sec]}</FormattedText>
              </div>
            ))}
            <TipsSection content={activity['Written Guide - Tips and Tricks']} activities={activities} tools={tools} currentActivityId={activity.id} />
          </div>
        </div>
      </div>
    </div>
  );
}