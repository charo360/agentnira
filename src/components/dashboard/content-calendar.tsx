// src/components/dashboard/content-calendar.tsx
"use client";

import React from "react";
import Link from 'next/link';
import { Loader2, Facebook, Instagram, Linkedin, Twitter, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/dashboard/post-card";
import { generateContentAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { BrandProfile, GeneratedPost, Platform, NewGeneratedPost } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type ContentCalendarProps = {
  brandProfile: BrandProfile | null;
  posts: GeneratedPost[];
  onPostGenerated: (post: NewGeneratedPost) => void;
  onPostUpdated: (post: GeneratedPost) => void;
};

const platforms: { name: Platform; icon: React.ElementType }[] = [
    { name: 'Instagram', icon: Instagram },
    { name: 'Facebook', icon: Facebook },
    { name: 'Twitter', icon: Twitter },
    { name: 'LinkedIn', icon: Linkedin },
];

export function ContentCalendar({ brandProfile, posts, onPostGenerated, onPostUpdated }: ContentCalendarProps) {
  const [isGenerating, setIsGenerating] = React.useState<Platform | null>(null);
  const { toast } = useToast();

  const handleGenerateClick = async (platform: Platform) => {
    if (!brandProfile) {
        toast({
            variant: "destructive",
            title: "Brand Profile Required",
            description: "Please set up your brand profile before generating content.",
        });
        return;
    }
    setIsGenerating(platform);
    try {
      const newPost = await generateContentAction(brandProfile, platform);
      onPostGenerated(newPost);
      toast({
        title: "Content Generated!",
        description: `A new ${platform} post has been added to your calendar.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const renderEmptyState = () => {
    if (!brandProfile) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-12 text-center">
                <Sparkles className="h-12 w-12 text-primary/70 mb-4" />
                <h3 className="text-xl font-semibold">Welcome to Quick Content!</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                    To start generating tailored social media posts, you first need to set up your brand profile.
                </p>
                <Button asChild>
                    <Link href="/brand-profile">Set Up Brand Profile</Link>
                </Button>
            </div>
        );
    }
    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-12 text-center">
              <h3 className="text-xl font-semibold">Your calendar is empty</h3>
              <p className="text-muted-foreground mt-2">
                Click the "Generate New Post" button to create your first social media post!
              </p>
            </div>
        );
    }
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Content Calendar</h1>
          <p className="text-muted-foreground">
            Generate and manage your social media content from one place.
          </p>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button disabled={!!isGenerating || !brandProfile}>
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating for {isGenerating}...
                        </>
                    ) : (
                        "✨ Generate New Post"
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {platforms.map((p) => (
                    <DropdownMenuItem key={p.name} onClick={() => handleGenerateClick(p.name)} disabled={!!isGenerating}>
                        <p.icon className="mr-2 h-4 w-4" />
                        <span>{p.name}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {posts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              brandProfile={brandProfile!} 
              onPostUpdated={onPostUpdated} 
            />
          ))}
        </div>
      ) : (
        renderEmptyState()
      )}
    </div>
  );
}
