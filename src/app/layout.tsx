// src/app/layout.tsx
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { BrandProfileProvider } from '@/contexts/BrandProfileContext';


const BRAND_THEME_KEY = "brandProfileTheme";

function BrandThemeLoader({ children }: { children: React.ReactNode }) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    // This effect runs on the client after hydration
    try {
      const storedTheme = localStorage.getItem(BRAND_THEME_KEY);
      if (storedTheme) {
        const theme: Partial<any> = JSON.parse(storedTheme);
        const newStyle: React.CSSProperties = {};
        if (theme.primaryColor) {
          newStyle['--primary-hsl'] = theme.primaryColor;
        }
        if (theme.accentColor) {
          newStyle['--accent-hsl'] = theme.accentColor;
        }
        if (theme.backgroundColor) {
          newStyle['--background-hsl'] = theme.backgroundColor;
        }
        setStyle(newStyle);
      }
    } catch (error) {
      console.error("Failed to apply brand colors from localStorage", error);
    }
  }, []);

  return (
    <div className="flex flex-1" style={style}>
      {children}
    </div>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [user, loading] = useAuthState(auth);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (loading) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className="font-body antialiased" suppressHydrationWarning>
          <div className="flex h-screen w-full items-center justify-center">
            <p>Loading...</p>
          </div>
          <Toaster />
        </body>
      </html>
    )
  }

  const showSidebar = !!user && pathname !== '/login' && pathname !== '/';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>LocalBuzz</title>
        <meta name="description" content="Hyper-local, relevant social media content generation for local businesses" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        {isClient ? (
          <BrandProfileProvider>
            {showSidebar ? (
              <SidebarProvider>
                <AppSidebar />
                <BrandThemeLoader>
                  {children}
                </BrandThemeLoader>
              </SidebarProvider>
            ) : (
              children
            )}
          </BrandProfileProvider>
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
