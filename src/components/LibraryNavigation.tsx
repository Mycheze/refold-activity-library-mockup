'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Library {
  id: string;
  name: string;
  href: string;
  count?: number;
}

interface LibraryNavigationProps {
  currentLibrary: string;
  libraries: Library[];
}

const LibraryNavigation = ({ currentLibrary, libraries }: LibraryNavigationProps) => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigation = (href: string) => {
    setIsMobileMenuOpen(false);
    router.push(href);
  };

  const currentLib = libraries.find(lib => lib.id === currentLibrary);

  // Define styles for each library type using colors that exist in Tailwind v2
  const getActiveStyles = (libraryId: string) => {
    if (libraryId === 'activities') {
      return 'bg-purple-600 text-white shadow-lg transform scale-105';
    } else if (libraryId === 'tools') {
      return 'bg-yellow-600 text-white shadow-lg transform scale-105';
    }
    return 'bg-gray-500 text-white shadow-lg transform scale-105'; // fallback
  };

  const getInactiveStyles = () => {
    return 'text-gray-600 hover:text-gray-900 hover:bg-gray-50';
  };

  return (
    <div className="mb-8">
      {/* Desktop Navigation - Enhanced Tabs */}
      <div className="hidden sm:block">
        <nav className="flex space-x-2 bg-white p-2 rounded-xl shadow-lg border border-gray-200">
          {libraries.map((library) => {
            const isActive = library.id === currentLibrary;
            
            return (
              <button
                key={library.id}
                onClick={() => handleNavigation(library.href)}
                className={`px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 flex-1 text-center flex items-center justify-center gap-2 ${
                  isActive ? getActiveStyles(library.id) : getInactiveStyles()
                }`}
              >
                <span>{library.name}</span>
                {library.count !== undefined && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isActive 
                      ? 'bg-white bg-opacity-20 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {library.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Navigation - Enhanced Dropdown */}
      <div className="sm:hidden">
        <div className="relative">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-4 text-left shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                currentLib?.id === 'activities' ? 'bg-purple-500' : 'bg-yellow-500'
              }`}></div>
              <span className="font-bold text-gray-900">
                {currentLib?.name || 'Select Library'}
              </span>
              {currentLib?.count !== undefined && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentLib.id === 'activities' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {currentLib.count}
                </span>
              )}
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transform transition-transform ${
                isMobileMenuOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-10">
              {libraries.map((library, index) => {
                const isActive = library.id === currentLibrary;
                
                // Determine mobile dropdown styles
                let dropdownClasses = "w-full px-4 py-4 text-left hover:bg-gray-50 flex items-center gap-3 ";
                
                if (isActive) {
                  if (library.id === 'activities') {
                    dropdownClasses += "bg-purple-50 text-purple-900 ";
                  } else if (library.id === 'tools') {
                    dropdownClasses += "bg-yellow-50 text-yellow-900 ";
                  }
                } else {
                  dropdownClasses += "text-gray-700 ";
                }
                
                if (index === 0) dropdownClasses += "rounded-t-xl ";
                if (index === libraries.length - 1) {
                  dropdownClasses += "rounded-b-xl ";
                } else {
                  dropdownClasses += "border-b border-gray-100 ";
                }
                
                return (
                  <button
                    key={library.id}
                    onClick={() => handleNavigation(library.href)}
                    className={dropdownClasses}
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      library.id === 'activities' ? 'bg-purple-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className={`font-medium ${isActive ? 'font-bold' : ''}`}>
                      {library.name}
                    </span>
                    {library.count !== undefined && (
                      <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                        isActive
                          ? (library.id === 'activities' ? 'bg-purple-200 text-purple-800' : 'bg-yellow-200 text-yellow-800')
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {library.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryNavigation;