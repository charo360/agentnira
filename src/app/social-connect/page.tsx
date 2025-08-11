// src/app/social-connect/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Facebook, Instagram, Linkedin, Twitter, User, LogOut } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

const AUTH_USER_KEY = 'mockAuthUser';
const BRAND_PROFILE_KEY = 'brandProfile';

function SocialConnectPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check for auth user
    const authUser = localStorage.getItem(AUTH_USER_KEY);
    if (!authUser) {
      router.push('/login');
      return;
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
      <header className="flex h-14 items-center justify-end gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
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
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold font-headline">
              Connect Your Social Media
            </h1>
            <p className="text-muted-foreground mt-2">
              Connect your accounts to allow the AI to learn your brand's unique
              voice and visual style from your past posts.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Platform Connections</CardTitle>
              <CardDescription>
                Manage your connected social media accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <Instagram className="h-6 w-6" />
                  <span className="font-medium">Instagram</span>
                </div>
                <Button disabled>Connect (Coming Soon)</Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <Facebook className="h-6 w-6" />
                  <span className="font-medium">Facebook</span>
                </div>
                <Button disabled>Connect (Coming Soon)</Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <Twitter className="h-6 w-6" />
                  <span className="font-medium">X / Twitter</span>
                </div>
                <Button disabled>Connect (Coming Soon)</Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <Linkedin className="h-6 w-6" />
                  <span className="font-medium">LinkedIn</span>
                </div>
                <Button disabled>Connect (Coming Soon)</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </SidebarInset>
  );
}

export default SocialConnectPage;
