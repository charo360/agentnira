// src/app/creative-studio/page.tsx
"use client";

import { useState, useEffect } from "react";
import type { BrandProfile } from "@/lib/types";
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
import { ChatLayout } from "@/components/studio/chat-layout";
import { User, LogOut } from "lucide-react";
import { ImageEditor } from "@/components/studio/image-editor";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const BRAND_PROFILE_KEY = "brandProfile";
const AUTH_USER_KEY = 'mockAuthUser';

function CreativeStudioPage() {
    const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
    const [editorImage, setEditorImage] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        // Check for auth user
        const authUser = localStorage.getItem(AUTH_USER_KEY);
        if (!authUser) {
          router.push('/login');
          return;
        }

        const storedProfile = localStorage.getItem(BRAND_PROFILE_KEY);
        if (storedProfile) {
            setBrandProfile(JSON.parse(storedProfile));
        }
    }, [router]);
    
    const handleLogout = () => {
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem(BRAND_PROFILE_KEY);
        router.push('/login');
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
    };


  return (
    <SidebarInset>
      <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:h-[60px] lg:px-6">
         <div />
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage
                    src="https://placehold.co/40x40.png"
                    alt="User"
                    data-ai-hint="user avatar"
                  />
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
               <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </header>
       <main className="flex-1 overflow-auto">
          {editorImage ? (
            <ImageEditor 
                imageUrl={editorImage}
                onClose={() => setEditorImage(null)}
                brandProfile={brandProfile}
            />
          ) : (
            <ChatLayout
                brandProfile={brandProfile}
                onEditImage={setEditorImage}
            />
          )}
      </main>
    </SidebarInset>
  );
}


export default CreativeStudioPage;
