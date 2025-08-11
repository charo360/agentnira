// src/app/content-calendar/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContentCalendar } from "@/components/dashboard/content-calendar";
import type { BrandProfile, GeneratedPost } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";


const BRAND_PROFILE_KEY = "brandProfile";
const GENERATED_POSTS_KEY = "generatedPosts";
const MAX_POSTS_TO_STORE = 10;

function ContentCalendarPage() {
  const [user, loading] = useAuthState(auth);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;
    if (!user) {
        router.push('/login');
        return;
    }
    
    setIsDataLoading(true);
    try {
      const storedProfile = localStorage.getItem(BRAND_PROFILE_KEY);
      if (storedProfile) {
        setBrandProfile(JSON.parse(storedProfile));
        const storedPosts = localStorage.getItem(GENERATED_POSTS_KEY);
        if (storedPosts) {
          setGeneratedPosts(JSON.parse(storedPosts));
        }
      } else {
        toast({
            title: "Brand Profile Not Found",
            description: "Please set up your brand profile first.",
            variant: "destructive"
        });
        router.push('/brand-profile');
      }
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Failed to load data",
        description: "Could not read your data from local storage. It might be corrupted.",
      });
    } finally {
      setIsDataLoading(false);
    }
  }, [user, loading, router, toast]);


  const handlePostGenerated = (post: GeneratedPost) => {
    const newPosts = [post, ...generatedPosts].slice(0, MAX_POSTS_TO_STORE);
    setGeneratedPosts(newPosts);
    localStorage.setItem(GENERATED_POSTS_KEY, JSON.stringify(newPosts));
  };
  
  const handlePostUpdated = async (updatedPost: GeneratedPost) => {
    try {
      const updatedPosts = generatedPosts.map((post) =>
        post.id === updatedPost.id ? updatedPost : post
      );
      setGeneratedPosts(updatedPosts);
      localStorage.setItem(GENERATED_POSTS_KEY, JSON.stringify(updatedPosts));
    } catch(error) {
        toast({
          variant: "destructive",
          title: "Failed to update post",
          description: (error as Error).message,
        });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem(BRAND_PROFILE_KEY);
    router.push('/login');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };
  
  if (loading || isDataLoading) {
      return (
        <SidebarInset>
            <main className="flex-1 flex items-center justify-center">
                <p>Loading Content Calendar...</p>
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
          {!brandProfile ? (
            <div className="flex h-full items-center justify-center">
              <p>Loading Content Calendar...</p>
            </div>
          ) : (
            <ContentCalendar
              brandProfile={brandProfile}
              posts={generatedPosts}
              onPostGenerated={handlePostGenerated}
              onPostUpdated={handlePostUpdated}
            />
          )}
        </main>
      </SidebarInset>
  );
}

export default ContentCalendarPage;
