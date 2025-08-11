// src/components/dashboard/post-card.tsx
"use client";

import * as React from 'react';
import Image from "next/image";
import { Facebook, Instagram, Linkedin, MoreVertical, Pen, RefreshCw, Twitter, CalendarIcon, Download, Loader2, Video, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { toPng } from 'html-to-image';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BrandProfile, GeneratedPost, Platform, PostVariant, NewGeneratedPost } from "@/lib/types";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { generateContentAction, generateVideoContentAction } from '@/app/actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';

const platformIcons: { [key in Platform]: React.ReactElement } = {
  Facebook: <Facebook className="h-4 w-4" />,
  Instagram: <Instagram className="h-4 w-4" />,
  LinkedIn: <Linkedin className="h-4 w-4" />,
  Twitter: <Twitter className="h-4 w-4" />,
};

type PostCardProps = {
  post: GeneratedPost;
  brandProfile: BrandProfile;
  onPostUpdated: (post: GeneratedPost) => Promise<void>;
};

export function PostCard({ post, brandProfile, onPostUpdated }: PostCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isRegenerating, setIsRegenerating] = React.useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = React.useState(false);
  const [editedContent, setEditedContent] = React.useState(post.content);
  const [editedHashtags, setEditedHashtags] = React.useState(post.hashtags);
  const [videoUrl, setVideoUrl] = React.useState<string | undefined>(post.videoUrl);
  const [showVideoDialog, setShowVideoDialog] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<Platform>(post.variants[0]?.platform || 'Instagram');
  const downloadRefs = React.useRef<Record<Platform, HTMLDivElement | null>>({} as Record<Platform, HTMLDivElement | null>);
  
  const formattedDate = format(new Date(post.date), 'MMM d, yyyy');
  const { toast } = useToast();

  const handleDownload = React.useCallback(async () => {
    const nodeToCapture = downloadRefs.current[activeTab];
    if (!nodeToCapture) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not find the image element to download.",
      });
      return;
    }

    try {
      const dataUrl = await toPng(nodeToCapture, {
        cacheBust: true,
        canvasWidth: 1080,
        canvasHeight: 1080,
        pixelRatio: 2,
        style: {
          borderRadius: '0',
          border: 'none',
        }
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `localbuzz-post-${post.id}-${activeTab}.png`;
      link.click();

    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: `Could not download the image. Please try again. Error: ${(err as Error).message}`,
      });
    }
  }, [post.id, activeTab, toast]);


  const handleSaveChanges = async () => {
    const updatedPost = {
        ...post,
        content: editedContent,
        hashtags: editedHashtags,
        status: 'edited' as const,
    };
    await onPostUpdated(updatedPost);
    setIsEditing(false);
    toast({
        title: "Post Updated",
        description: "Your changes have been saved.",
    });
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
        const platform = post.variants[0].platform;
        const newPostContent = await generateContentAction(brandProfile, platform);
        const updatedPost: GeneratedPost = {
            ...post, // Retain ID, date, etc.
            ...newPostContent, // Overwrite with new content
        };
        onPostUpdated(updatedPost);
        toast({
            title: "Post Regenerated!",
            description: "A new version of your post has been generated.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Regeneration Failed",
            description: (error as Error).message,
        });
    } finally {
        setIsRegenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if(!post.imageText) {
        toast({
            variant: "destructive",
            title: "Cannot Generate Video",
            description: "The post is missing the required image text.",
        });
        return;
    }
    setIsGeneratingVideo(true);
    try {
        const result = await generateVideoContentAction(brandProfile, post.imageText, post.content);
        const newVideoUrl = result.videoUrl;
        setVideoUrl(newVideoUrl);
        await onPostUpdated({ ...post, videoUrl: newVideoUrl });
        setShowVideoDialog(true);
        toast({
            title: "Video Generated!",
            description: "Your video is ready to be viewed.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Video Generation Failed",
            description: (error as Error).message,
        });
    } finally {
        setIsGeneratingVideo(false);
    }
  };

  const activeVariant = post.variants.find(v => v.platform === activeTab) || post.variants[0];

  return (
    <>
      <Card className="flex flex-col">
         <CardHeader className="flex-row items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>{formattedDate}</span>
            </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6" disabled={isRegenerating || isGeneratingVideo}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pen className="mr-2 h-4 w-4" />
                Edit Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRegenerate} disabled={isRegenerating}>
                {isRegenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Regenerate Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleGenerateVideo} disabled={isGeneratingVideo}>
                {isGeneratingVideo ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Video className="mr-2 h-4 w-4" />
                )}
                Generate Video
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download Image
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="flex-grow space-y-4 p-4 pt-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Platform)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                {post.variants.map(variant => (
                    <TabsTrigger key={variant.platform} value={variant.platform}>
                        {platformIcons[variant.platform]}
                    </TabsTrigger>
                ))}
            </TabsList>
            {post.variants.map(variant => (
                <TabsContent key={variant.platform} value={variant.platform}>
                    <div className="relative aspect-square w-full overflow-hidden">
                        {(isRegenerating || isGeneratingVideo) && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="sr-only">{isRegenerating ? 'Regenerating image...' : 'Generating video...'}</span>
                            </div>
                        )}
                        <div ref={el => (downloadRefs.current[variant.platform] = el)} className="relative aspect-square w-full overflow-hidden rounded-md border">
                            {variant.imageUrl ? (
                                <Image
                                    alt={`Generated post image for ${variant.platform}`}
                                    className={cn('h-full w-full object-cover transition-opacity', (isRegenerating || isGeneratingVideo) ? 'opacity-50' : 'opacity-100')}
                                    height={1080}
                                    src={variant.imageUrl}
                                    data-ai-hint="social media post"
                                    width={1080}
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-muted">
                                    <ImageOff className="h-12 w-12 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            ))}
          </Tabs>
          
          <div className="space-y-2">
              <p className="text-sm text-foreground line-clamp-4">{post.content}</p>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <div className="flex flex-wrap gap-1">
            {post.hashtags.split(" ").map((tag, index) => (
              <Badge key={index} variant="secondary" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        </CardFooter>
      </Card>

      {/* Edit Post Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Make changes to your post content and hashtags below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="h-32"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hashtags">Hashtags</Label>
              <Input
                id="hashtags"
                value={editedHashtags}
                onChange={(e) => setEditedHashtags(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Video Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generated Video</DialogTitle>
            <DialogDescription>
              Here is the video generated for your post. You can download it from here.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            {videoUrl ? (
                <video controls autoPlay src={videoUrl} className="w-full rounded-md" />
            ) : (
                <p>No video available.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVideoDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
