'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const STARRED_STORAGE_KEY = 'refold-starred-activities';

interface StarredContextType {
  starredIds: string[];
  isStarred: (activityId: string) => boolean;
  toggleStar: (activityId: string) => void;
  isLoaded: boolean;
}

const StarredContext = createContext<StarredContextType | undefined>(undefined);

export const useStarredActivities = () => {
  const context = useContext(StarredContext);
  if (!context) {
    throw new Error('useStarredActivities must be used within a StarredProvider');
  }
  return context;
};

interface StarredProviderProps {
  children: ReactNode;
}

export const StarredProvider = ({ children }: StarredProviderProps) => {
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load starred activities from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STARRED_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStarredIds(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Failed to load starred activities:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever starredIds changes (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify(starredIds));
      } catch (error) {
        console.error('Failed to save starred activities:', error);
      }
    }
  }, [starredIds, isLoaded]);

  const toggleStar = (activityId: string) => {
    setStarredIds(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId);
      } else {
        return [...prev, activityId];
      }
    });
  };

  const isStarred = (activityId: string) => starredIds.includes(activityId);

  const value: StarredContextType = {
    starredIds,
    isStarred,
    toggleStar,
    isLoaded
  };

  return (
    <StarredContext.Provider value={value}>
      {children}
    </StarredContext.Provider>
  );
};