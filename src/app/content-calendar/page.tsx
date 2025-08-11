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
import type { BrandProfile, GeneratedPost, NewGeneratedPost } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { getBrandProfile, getGeneratedPosts, saveGeneratedPost, updateGeneratedPost } from "@/app/actions";


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
    
    const loadData = async () => {
        setIsDataLoading(true);
        try {
            const profile = await getBrandProfile(user.uid);
            // We set the profile, which can be null if it doesn't exist.
            // The ContentCalendar component will handle the null case.
            setBrandProfile(profile);
            if (profile) {
                const posts = await getGeneratedPosts(user.uid);
                setGeneratedPosts(posts);
            }
        } catch (error) {
           toast({
            variant: "destructive",
            title: "Failed to load data",
            description: (error as Error).message,
          });
        } finally {
          setIsDataLoading(false);
        }
    };
    
    loadData();

  }, [user, loading, router, toast]);


  const handlePostGenerated = async (post: NewGeneratedPost) => {
    if (!user) return;
    try {
        const savedPost = await saveGeneratedPost(user.uid, post);
        setGeneratedPosts(prevPosts => [savedPost, ...prevPosts]);
    } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to save post",
          description: (error as Error).message,
        });
    }
  };
  
  const handlePostUpdated = async (updatedPost: GeneratedPost) => {
    if (!user) return;
    try {
      await updateGeneratedPost(user.uid, updatedPost);
      const updatedPosts = generatedPosts.map((post) =>
        post.id === updatedPost.id ? updatedPost : post
      );
      setGeneratedPosts(updatedPosts);
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
    localStorage.removeItem("brandProfileTheme");
    router.push('/login');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };
  
  if (loading || isDataLoading) {
      return (
        <SidebarInset>
            <main className="flex-1 flex items-center justify-center">
                <p>Loading Quick Content...</p>
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
            <ContentCalendar
              brandProfile={brandProfile}
              posts={generatedPosts}
              onPostGenerated={handlePostGenerated}
              onPostUpdated={handlePostUpdated}
            />
        </main>
      </SidebarInset>
  );
}

export default ContentCalendarPage;
