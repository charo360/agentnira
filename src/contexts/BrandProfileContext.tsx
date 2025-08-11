"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getBrandProfile } from '@/app/actions';
import type { BrandProfile } from '@/lib/types';

interface BrandProfileContextType {
  brandProfile: BrandProfile | null;
  setBrandProfile: (profile: BrandProfile | null) => void;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const BrandProfileContext = createContext<BrandProfileContextType | undefined>(undefined);

export function BrandProfileProvider({ children }: { children: React.ReactNode }) {
  const [user, authLoading] = useAuthState(auth);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const refreshProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log("🔄 Refreshing brand profile from context");
      const profile = await getBrandProfile(user.uid);
      setBrandProfile(profile);
      setHasLoaded(true);
      console.log("✅ Brand profile loaded in context:", profile ? "Found" : "Not found");
    } catch (error) {
      console.error("❌ Error loading brand profile in context:", error);
      setBrandProfile(null);
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Load profile when user changes
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setBrandProfile(null);
      setHasLoaded(false);
      return;
    }

    // Only load if we haven't loaded yet for this user
    if (!hasLoaded) {
      refreshProfile();
    }
  }, [user, authLoading, hasLoaded]);

  const value = {
    brandProfile,
    setBrandProfile: (profile: BrandProfile | null) => {
      setBrandProfile(profile);
      setHasLoaded(true);
    },
    isLoading,
    refreshProfile
  };

  return (
    <BrandProfileContext.Provider value={value}>
      {children}
    </BrandProfileContext.Provider>
  );
}

export function useBrandProfile() {
  const context = useContext(BrandProfileContext);
  if (context === undefined) {
    throw new Error('useBrandProfile must be used within a BrandProfileProvider');
  }
  return context;
}
