'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

interface IntroModalProps {
  showInitially?: boolean;
  onClose?: () => void;
  type?: 'activities' | 'tools';
}

const IntroModal = ({ showInitially = false, onClose, type = 'activities' }: IntroModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstH1Seen = useRef(false);
  
  // Separate storage keys for activities and tools
  const STORAGE_KEY = `refold-intro-dismissed-${type}`;

  const handleClose = useCallback(() => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsOpen(false);
    onClose?.();
  }, [dontShowAgain, onClose, STORAGE_KEY]);

  // Load markdown content based on type
  useEffect(() => {
    const loadMarkdown = async () => {
      try {
        setLoading(true);
        const filename = type === 'tools' ? 'tools_intro.md' : 'activities_intro.md';
        const response = await fetch(`/${filename}`);
        if (response.ok) {
          const text = await response.text();
          setMarkdownContent(text);
          setContentLoaded(true);
        } else {
          console.error(`Failed to fetch ${filename}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Failed to load intro markdown:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMarkdown();
  }, [type]);

  // Initialize checkbox state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      setDontShowAgain(true);
    }
  }, [STORAGE_KEY]);

  // Check if should show initially
  useEffect(() => {
    if (showInitially && contentLoaded && markdownContent) {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        // Delay showing the modal slightly
        setTimeout(() => setIsOpen(true), 1500);
      }
    }
  }, [showInitially, contentLoaded, markdownContent, STORAGE_KEY]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
      // Reset the h1 tracking when modal opens
      firstH1Seen.current = false;
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const openModal = () => {
    if (contentLoaded && markdownContent) {
      setIsOpen(true);
    }
  };

  // Dynamic title based on type
  const modalTitle = type === 'tools' 
    ? 'Welcome to Refold Tool Library' 
    : 'Welcome to Refold Activity Library';

  return (
    <>
      {/* Help button - always render */}
      <button
        onClick={openModal}
        className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
        style={{ color: '#6B7280' }}
        title="Show introduction"
        disabled={!contentLoaded}
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
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </button>

      {/* Modal - only render if content is loaded */}
      {isOpen && contentLoaded && markdownContent && (
        <div 
          className="fixed inset-0 z-50 p-4 md:p-8 lg:p-12 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="intro-modal-title"
        >
          <div className="min-h-full flex items-start justify-start md:items-center md:justify-center">
            <div 
              ref={modalRef}
              className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col my-4 md:my-0"
              tabIndex={-1}
              onClick={e => e.stopPropagation()}
            >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#D1D5DB' }}>
              <h2 id="intro-modal-title" className="text-xl font-extrabold" style={{ color: '#230E77' }}>
                {modalTitle}
              </h2>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg transition-colors duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2"
                style={{ color: '#6B7280' }}
                aria-label="Close modal"
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
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 max-h-[50vh] md:max-h-[75vh]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#6544E9' }}></div>
                </div>
              ) : (
                <div className="prose prose-gray max-w-none text-left">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => {
                        // Skip the first h1 since we show the title in the header
                        if (!firstH1Seen.current) {
                          firstH1Seen.current = true;
                          return null;
                        }
                        
                        return (
                          <h1 className="text-2xl font-extrabold mb-4 text-left" style={{ color: '#230E77' }}>
                            {children}
                          </h1>
                        );
                      },
                      h2: ({ children }) => (
                        <h2 className="text-xl font-extrabold mb-3 mt-6 text-left" style={{ color: '#230E77' }}>
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-bold mb-2 mt-4 text-left" style={{ color: '#230E77' }}>
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-3 text-gray-700 leading-relaxed text-left">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700 text-left">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-700 text-left">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-gray-700 text-left">
                          {children}
                        </li>
                      ),
                      a: ({ href, children }) => (
                        <a 
                          href={href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:no-underline transition-all duration-200"
                          style={{ color: '#6544E9' }}
                        >
                          {children}
                        </a>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold text-left" style={{ color: '#230E77' }}>
                          {children}
                        </strong>
                      ),
                      code: ({ children }) => (
                        <code className="px-1 py-0.5 bg-gray-100 rounded text-sm font-mono">
                          {children}
                        </code>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 pl-4 italic text-gray-600 my-4 text-left" style={{ borderColor: '#6544E9' }}>
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {markdownContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t space-y-4" style={{ borderColor: '#D1D5DB' }}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600">
                  Don&apos;t show this again
                </span>
              </label>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm border rounded-lg hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 bg-white"
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
                  Got it!
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IntroModal;