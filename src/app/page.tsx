'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import FeedbackButton from '../components/FeedbackButton';

interface Activity {
  [key: string]: string;
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

const FormattedText = ({ children }: { children?: string }) => {
  if (!children) return null;
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const formatTextWithLinks = (text: string) => {
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
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
      }
      return part;
    });
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

const TipsSection = ({ content }: { content?: string }) => {
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
          <FormattedText>{content}</FormattedText>
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

const Card = ({ act }: { act: Activity }) => {
  const [open, setOpen] = useState(false);
  const toggle = (e: React.MouseEvent) => { 
    e.stopPropagation(); 
    setOpen(x => !x); 
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on the external link icon or feedback button
    if ((e.target as HTMLElement).closest('.external-link-icon') || 
        (e.target as HTMLElement).closest('button')) {
      return;
    }
    toggle(e);
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
  
  const whyUrl = getEmbedUrl(act['Video What and why']);
  const demoUrl = getEmbedUrl(act['Video Demo']);

  return (
    <div 
      onClick={handleCardClick}
      onMouseDown={handleMiddleClick}
      className="cursor-pointer rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 relative"
      style={{ backgroundColor: '#FFFFFE' }}
    >
      {/* External link icon */}
      <button
        onClick={handleExternalLinkClick}
        className="external-link-icon absolute top-3 right-3 p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2"
        style={{ 
          color: '#6544E9',
          zIndex: 10
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

      {open && (
        <div className="p-4 sm:p-6 bg-gray-50 space-y-6">
          <FormattedText>{act['Long Description']}</FormattedText>
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
              <FormattedText>{act[sec]}</FormattedText>
            </div>
          ))}
          <TipsSection content={act['Written Guide - Tips and Tricks']} />
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [filters, setFilters] = useState({
    pillar: '',
    phase: '',
    parentSkill: ''
  });

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

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/export_activity_library.tsv');
        const text = await response.text();
        
        Papa.parse(text, {
          header: true,
          delimiter: '\t',
          skipEmptyLines: false,
          newline: '\n',
          complete: (res) => {
            const cleaned = (res.data as Record<string, unknown>[]).map((r) => {
              const o: Activity = {};
              Object.entries(r).forEach(([k, v]) => {
                o[k] = typeof v === 'string' ? v.replace(/\r/g, '').replace(/⏎/g, '\n') : v as string;
              });
              return o;
            });
            
            // Sort by ID (convert to number for proper sorting)
            const sorted = cleaned.sort((a, b) => {
              const idA = parseInt(a.id) || 0;
              const idB = parseInt(b.id) || 0;
              return idA - idB;
            });
            
            setActivities(sorted);
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <header className="mb-8 text-center">
          <div className="flex justify-center items-center gap-4 mb-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ color: '#230E77' }}>
              Refold Activity Library
            </h1>
            
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
          
          <p className="mt-2 text-sm sm:text-base font-roboto text-gray-600">
            {loading ? 'Loading activity data...' : `Loaded ${activities.length} activities`}
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
            </div>
          </div>
        )}

        <div className="space-y-6">
          {filtered.map((a, i) => <Card key={i} act={a} />)}
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