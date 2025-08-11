// src/app/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Sparkles, Wand } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-background/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Bot className="h-6 w-6 text-primary" />
          <span className="sr-only">LocalBuzz</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Features
          </Link>
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Pricing
          </Link>
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            About
          </Link>
           <Button asChild>
                <Link href="/login">
                    Sign Up
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full pt-24 md:pt-32 lg:pt-40 border-y bg-card">
          <div className="px-4 md:px-6 space-y-10 xl:space-y-16">
            <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16">
              <div>
                <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem] font-headline">
                  Generate Hyper-Local Social Content in Seconds
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
                  LocalBuzz is your AI-powered creative partner, designed to help small businesses create stunning, brand-consistent, and locally-relevant social media ads effortlessly.
                </p>
                <div className="space-x-4 mt-6">
                  <Button asChild size="lg">
                    <Link href="/login">
                      Get Started for Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                 <Image 
                    src="https://placehold.co/600x400.png"
                    alt="Hero Image"
                    width={600}
                    height={400}
                    className="rounded-xl shadow-2xl"
                    data-ai-hint="social media marketing dashboard"
                 />
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container space-y-12 px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Everything You Need to Dominate Local Social
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From brand analysis to one-click generation, we've got you covered.
                </p>
              </div>
            </div>
            <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
              <div className="grid gap-1 p-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors">
                <Sparkles className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">AI Brand Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI learns your brand's voice, colors, and style from your website to ensure every post is perfectly on-brand.
                </p>
              </div>
              <div className="grid gap-1 p-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors">
                <Bot className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">One-Click Content Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Generate entire social media posts, including captions, hashtags, and images, tailored to your business with a single click.
                </p>
              </div>
              <div className="grid gap-1 p-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors">
                <Wand className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Creative Studio</h3>
                <p className="text-sm text-muted-foreground">
                  Go beyond templates. Use our Creative Studio to generate unique images and videos from a text prompt, or edit existing assets with AI.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 LocalBuzz. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
