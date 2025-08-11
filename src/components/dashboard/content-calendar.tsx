// src/components/dashboard/content-calendar.tsx
"use client";

import React from "react";
import { Loader2, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/dashboard/post-card";
import { generateContentAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { BrandProfile, GeneratedPost, Platform, NewGeneratedPost } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type ContentCalendarProps = {
  brandProfile: BrandProfile;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Content Calendar</h1>
          <p className="text-muted-foreground">
            Here's your generated content. Click a post to edit or regenerate.
          </p>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button disabled={!!isGenerating}>
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
              brandProfile={brandProfile} 
              onPostUpdated={onPostUpdated} 
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-12 text-center">
          <h3 className="text-xl font-semibold">Your calendar is empty</h3>
          <p className="text-muted-foreground mt-2">
            Click the "Generate" button to create your first social media post!
          </p>
        </div>
      )}
    </div>
  );
}
