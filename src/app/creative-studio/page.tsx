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
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const BRAND_PROFILE_KEY = "brandProfile";

function CreativeStudioPage() {
    const [user, loading] = useAuthState(auth);
    const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
    const [editorImage, setEditorImage] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (loading) return;
        if (!user) {
          router.push('/login');
          return;
        }

        const storedProfile = localStorage.getItem(BRAND_PROFILE_KEY);
        if (storedProfile) {
            setBrandProfile(JSON.parse(storedProfile));
        }
    }, [user, loading, router]);
    
    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem(BRAND_PROFILE_KEY);
        router.push('/login');
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
    };

    if (loading) {
        return (
          <SidebarInset>
              <main className="flex-1 flex items-center justify-center">
                  <p>Loading Creative Studio...</p>
              </main>
          </SidebarInset>
        );
    }

  return (
    <SidebarInset>
      <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:h-[60px] lg:px-6">
         <div />
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage
                    src={user?.photoURL || "https://placehold.co/40x40.png"}
                    alt={user?.displayName || "User"}
                    data-ai-hint="user avatar"
                  />
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
