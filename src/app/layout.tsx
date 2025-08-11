// src/app/layout.tsx
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import React, { useEffect, useState } from 'react';
import type { BrandProfile } from '@/lib/types';
import { usePathname } from 'next/navigation';


const BRAND_PROFILE_KEY = "brandProfile";

function BrandThemeLoader({ children }: { children: React.ReactNode }) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    const fetchProfileAndSetTheme = () => {
      try {
        const storedProfile = localStorage.getItem(BRAND_PROFILE_KEY);
        if (storedProfile) {
          const profile: BrandProfile = JSON.parse(storedProfile);
          const newStyle: React.CSSProperties = {};
          if (profile.primaryColor) {
              newStyle['--primary-hsl'] = profile.primaryColor;
          }
          if (profile.accentColor) {
              newStyle['--accent-hsl'] = profile.accentColor;
          }
          if (profile.backgroundColor) {
              newStyle['--background-hsl'] = profile.backgroundColor;
          }
          setStyle(newStyle);
        }
      } catch (error) {
        console.error("Failed to apply brand colors from localStorage", error);
      } finally {
        setProfileLoaded(true);
      }
    };
    
    fetchProfileAndSetTheme();
  }, []);

  if (!profileLoaded) {
    return (
        <div className="flex-1 flex items-center justify-center">
            <p>Loading Brand Profile...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-1" style={style}>
        {children}
    </div>
  )
}

const AUTH_USER_KEY = 'mockAuthUser';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const user = localStorage.getItem(AUTH_USER_KEY);
    setIsLoggedIn(!!user);
  }, [pathname]); // Re-check on path change

  const showSidebar = isLoggedIn && pathname !== '/login' && pathname !== '/';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>LocalBuzz</title>
        <meta name="description" content="Hyper-local, relevant social media content generation for local businesses" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
          {isClient ? (
            showSidebar ? (
              <SidebarProvider>
                <AppSidebar />
                <BrandThemeLoader>
                  {children}
                </BrandThemeLoader>
              </SidebarProvider>
            ) : (
              children
            )
          ) : (
             <div className="flex h-screen w-full items-center justify-center">
                <p>Loading...</p>
             </div>
          )}
          <Toaster />
      </body>
    </html>
  );
}
