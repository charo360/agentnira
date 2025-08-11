// src/app/brand-profile/page.tsx
"use client";

import * as React from "react";
import { BrandSetup } from "@/components/dashboard/brand-setup";
import type { BrandProfile } from "@/lib/types";
import { SidebarInset } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Bot, User, LogOut } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";


const BRAND_PROFILE_KEY = "brandProfile";

function BrandProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, loading] = useAuthState(auth);
  const [brandProfile, setBrandProfile] = React.useState<BrandProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = React.useState(true);

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    setIsProfileLoading(true);
    try {
      const storedProfile = localStorage.getItem(BRAND_PROFILE_KEY);
      if (storedProfile) {
        setBrandProfile(JSON.parse(storedProfile));
      }
    } catch (error) {
      console.error("Failed to parse brand profile from localStorage", error);
      toast({
        variant: "destructive",
        title: "Failed to load profile",
        description: "Could not read your profile from local storage. It might be corrupted.",
      });
    } finally {
      setIsProfileLoading(false);
    }
  }, [user, loading, toast, router]);

  const handleProfileSaved = async (profile: BrandProfile) => {
    try {
        const isFirstSave = !brandProfile;
        localStorage.setItem(BRAND_PROFILE_KEY, JSON.stringify(profile));
        setBrandProfile(profile);
        toast({
            title: "Profile Saved!",
            description: "Your brand profile has been updated successfully.",
        });
        
        // Reload to apply theme colors if they changed
        window.location.reload();
        
        if (isFirstSave) {
            router.push('/content-calendar');
        }

    } catch (error) {
        toast({
            variant: "destructive",
            title: "Failed to save profile",
            description: (error as Error).message,
        });
    }
  };
  
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem(BRAND_PROFILE_KEY); // Also clear brand profile on logout
    router.push('/login');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

  if (loading || isProfileLoading) {
     return (
        <SidebarInset>
            <main className="flex-1 flex items-center justify-center">
                <p>Loading Profile...</p>
            </main>
        </SidebarInset>
     );
  }

  return (
      <SidebarInset>
        <header className="flex h-14 items-center justify-end gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src={user?.photoURL || "https://placehold.co/40x40.png"} alt={user?.displayName || "User"} data-ai-hint="user avatar" />
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email || "My Account"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
            <BrandSetup 
                initialProfile={brandProfile} 
                onProfileSaved={handleProfileSaved} 
            />
        </main>
      </SidebarInset>
  );
}

export default BrandProfilePage;
