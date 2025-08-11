// src/components/dashboard/brand-setup.tsx
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Sparkles, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { BrandAnalysisResult, BrandProfile } from "@/lib/types";
import { analyzeBrandAction } from "@/app/actions";
import Image from "next/image";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

// Helper to convert hex to HSL string
const hexToHslString = (hex: string): string => {
    hex = hex.replace(/^#/, '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
};

// Helper to convert HSL string to hex
const hslStringToHex = (hslStr: string): string => {
    if (!hslStr || typeof hslStr !== 'string') return "#000000";
    const parts = hslStr.match(/(\d+\.?\d*)/g);
    if (!parts || parts.length < 3) return "#000000";

    const [h, s, l] = parts.map(Number);
    const s_norm = s / 100;
    const l_norm = l / 100;
    let c = (1 - Math.abs(2 * l_norm - 1)) * s_norm,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l_norm - c / 2,
        r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { [r, g, b] = [c, x, 0]; }
    else if (60 <= h && h < 120) { [r, g, b] = [x, c, 0]; }
    else if (120 <= h && h < 180) { [r, g, b] = [0, c, x]; }
    else if (180 <= h && h < 240) { [r, g, b] = [0, x, c]; }
    else if (240 <= h && h < 300) { [r, g, b] = [x, 0, c]; }
    else if (300 <= h && h < 360) { [r, g, b] = [c, 0, x]; }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

const formSchema = z.object({
  businessName: z.string().min(2, { message: "Business name must be at least 2 characters." }),
  businessType: z.string().min(2, { message: "Business type must be at least 2 characters." }),
  location: z.string().min(2, { message: "Location must be at least 2 characters." }),
  websiteUrl: z.string().url({ message: "Please enter a valid URL." }),
  logo: z.any().optional(),
  designs: z.any().optional(),
  
  // Brand Identity
  visualStyle: z.string().optional(),
  writingTone: z.string().optional(),
  contentThemes: z.string().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  
  // New Fields
  description: z.string().optional(),
  services: z.string().optional(),
  targetAudience: z.string().optional(),
  keyFeatures: z.string().optional(),
  competitiveAdvantages: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  contactAddress: z.string().optional(),
});

type BrandSetupProps = {
  initialProfile: BrandProfile | null;
  onProfileSaved: (profile: BrandProfile) => void;
};

export function BrandSetup({ initialProfile, onProfileSaved }: BrandSetupProps) {
  const [user] = useAuthState(auth);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<BrandAnalysisResult | null>(initialProfile ? {
      visualStyle: initialProfile.visualStyle,
      writingTone: initialProfile.writingTone,
      contentThemes: initialProfile.contentThemes,
      description: initialProfile.description || "",
      services: initialProfile.services || "",
      contactInfo: initialProfile.contactInfo || {},
  } : null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(initialProfile?.logoDataUrl || null);
  const [logoDataUrl, setLogoDataUrl] = React.useState<string>(initialProfile?.logoDataUrl || "");
  const [designPreviews, setDesignPreviews] = React.useState<string[]>([]);
  const [designDataUrls, setDesignDataUrls] = React.useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: initialProfile?.businessName || "",
      businessType: initialProfile?.businessType || "",
      location: initialProfile?.location || "",
      websiteUrl: initialProfile?.websiteUrl || "https://",
      primaryColor: initialProfile?.primaryColor ? hslStringToHex(initialProfile.primaryColor) : "#3399FF",
      accentColor: initialProfile?.accentColor ? hslStringToHex(initialProfile.accentColor) : "#33B2B2",
      backgroundColor: initialProfile?.backgroundColor ? hslStringToHex(initialProfile.backgroundColor) : "#F0F8FF",
      visualStyle: initialProfile?.visualStyle || "",
      writingTone: initialProfile?.writingTone || "",
      contentThemes: initialProfile?.contentThemes || "",
      description: initialProfile?.description || "",
      services: initialProfile?.services || "",
      targetAudience: initialProfile?.targetAudience || "",
      keyFeatures: initialProfile?.keyFeatures || "",
      competitiveAdvantages: initialProfile?.competitiveAdvantages || "",
      contactPhone: initialProfile?.contactInfo?.phone || "",
      contactEmail: initialProfile?.contactInfo?.email || "",
      contactAddress: initialProfile?.contactInfo?.address || "",
    },
  });

  React.useEffect(() => {
    if (initialProfile) {
      form.reset({
        businessName: initialProfile.businessName,
        businessType: initialProfile.businessType,
        location: initialProfile.location,
        websiteUrl: initialProfile.websiteUrl || "https://",
        primaryColor: initialProfile.primaryColor ? hslStringToHex(initialProfile.primaryColor) : "#3399FF",
        accentColor: initialProfile.accentColor ? hslStringToHex(initialProfile.accentColor) : "#33B2B2",
        backgroundColor: initialProfile.backgroundColor ? hslStringToHex(initialProfile.backgroundColor) : "#F0F8FF",
        visualStyle: initialProfile.visualStyle,
        writingTone: initialProfile.writingTone,
        contentThemes: initialProfile.contentThemes,
        description: initialProfile.description,
        services: initialProfile.services,
        targetAudience: initialProfile.targetAudience,
        keyFeatures: initialProfile.keyFeatures,
        competitiveAdvantages: initialProfile.competitiveAdvantages,
        contactPhone: initialProfile.contactInfo?.phone,
        contactEmail: initialProfile.contactInfo?.email,
        contactAddress: initialProfile.contactInfo?.address,
      });
      setAnalysisResult({
        visualStyle: initialProfile.visualStyle,
        writingTone: initialProfile.writingTone,
        contentThemes: initialProfile.contentThemes,
        description: initialProfile.description || "",
        services: initialProfile.services || "",
        contactInfo: initialProfile.contactInfo || {},
      });
      setLogoPreview(initialProfile.logoDataUrl);
      setLogoDataUrl(initialProfile.logoDataUrl);
    }
  }, [initialProfile, form]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        setLogoDataUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDesignsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const dataUrlPromises = fileArray.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(dataUrlPromises).then(urls => {
        setDesignPreviews(prev => [...prev, ...urls]);
        setDesignDataUrls(prev => [...prev, ...urls]);
      });
    }
  };

  async function onAnalyze(values: z.infer<typeof formSchema>) {
    if (designDataUrls.length === 0) {
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "Please upload at least one previous design example.",
        });
        return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeBrandAction(values.websiteUrl, designDataUrls);
      setAnalysisResult(result);
      form.setValue("visualStyle", result.visualStyle);
      form.setValue("writingTone", result.writingTone);
      form.setValue("contentThemes", result.contentThemes);
      form.setValue("description", result.description);
      form.setValue("services", result.services);
      form.setValue("contactPhone", result.contactInfo.phone);
      form.setValue("contactEmail", result.contactInfo.email);
      form.setValue("contactAddress", result.contactInfo.address);
      
      toast({
        title: "Analysis Complete!",
        description: "AI analysis has been populated into the fields below. Review and save the profile.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  const handleSaveProfile = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to save." });
        return;
    }
    
    const formValues = form.getValues();
    
    if (!logoDataUrl) {
        toast({ variant: "destructive", title: "Missing Logo", description: "Please upload a logo." });
        return;
    }
    if (!formValues.visualStyle || !formValues.writingTone || !formValues.contentThemes) {
        toast({ variant: "destructive", title: "Analysis Required", description: "Please run brand analysis or fill in identity fields." });
        return;
    }

    const profile: BrandProfile = {
      ...formValues,
      logoDataUrl,
      primaryColor: formValues.primaryColor ? hexToHslString(formValues.primaryColor) : undefined,
      accentColor: formValues.accentColor ? hexToHslString(formValues.accentColor) : undefined,
      backgroundColor: formValues.backgroundColor ? hexToHslString(formValues.backgroundColor) : undefined,
      contactInfo: {
        phone: formValues.contactPhone,
        email: formValues.contactEmail,
        address: formValues.contactAddress,
      },
    };
    
    setIsSaving(true);
    try {
        // onProfileSaved is now called from the parent page, which already has the user.
        // The parent page will call the server action.
        onProfileSaved(profile);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Failed to save profile",
            description: (error as Error).message,
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">{initialProfile ? "Manage Brand Profile" : "Welcome to LocalBuzz"}</h1>
        <p className="text-muted-foreground">
          {initialProfile ? "Update your brand details below." : "Let's set up your brand profile to generate perfectly tailored content."}
        </p>
      </div>
       <Form {...form}>
        <form onSubmit={(e) => {e.preventDefault(); handleSaveProfile();}} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Basics</CardTitle>
              <CardDescription>
                Provide core details about your business and upload your logo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField control={form.control} name="businessName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl><Input placeholder="e.g., The Corner Cafe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="businessType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <FormControl><Input placeholder="e.g., Restaurant, Salon" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField control={form.control} name="logo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Logo</FormLabel>
                    <FormControl>
                      <div className="flex w-full items-center gap-4">
                        <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-md border border-dashed">
                          {logoPreview ? (
                            <Image src={logoPreview} alt="Logo preview" layout="fill" objectFit="contain" />
                          ) : (
                            <Upload className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <Input type="file" accept="image/*" className="w-full" onChange={handleLogoChange} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl><Input placeholder="e.g., San Francisco, CA" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
               <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                    <FormLabel>Business Description</FormLabel>
                    <FormControl><Textarea placeholder="Describe what your business does." {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
              )}/>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div>
                    <CardTitle>Brand Discovery & Analysis</CardTitle>
                    <CardDescription>
                        Provide your website and some design examples for AI-powered brand analysis.
                    </CardDescription>
                </div>
                 <Button type="button" onClick={form.handleSubmit(onAnalyze)} disabled={isAnalyzing} className="mt-4 w-full md:mt-0 md:w-auto">
                    {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : <><Sparkles className="mr-2 h-4 w-4" />{analysisResult ? "Re-analyze Brand" : "Analyze Brand"}</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl><Input placeholder="https://yourbusiness.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="designs" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Designs</FormLabel>
                     <FormDescription>Upload a few examples of your marketing materials (PNG, JPG).</FormDescription>
                    <FormControl>
                      <Input type="file" accept="image/*" multiple className="w-full" onChange={handleDesignsChange} />
                    </FormControl>
                    {designPreviews.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
                        {designPreviews.map((src, index) => (
                          <div key={index} className="relative aspect-square">
                            <Image src={src} alt={`Design preview ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md" />
                            <Button type="button" variant="destructive" size="icon" className="absolute -right-2 -top-2 h-5 w-5 rounded-full" onClick={() => {
                              setDesignPreviews(prev => prev.filter((_, i) => i !== index));
                              setDesignDataUrls(prev => prev.filter((_, i) => i !== index));
                            }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )} />
              
                <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                    <h3 className="font-semibold text-lg">Analysis Results & Brand Identity</h3>
                    <p className="text-sm text-muted-foreground">The AI will populate these fields after analysis. You can also edit them manually.</p>
                    <div className="grid gap-6">
                        <FormField control={form.control} name="visualStyle" render={({ field }) => (
                            <FormItem><FormLabel>Visual Style</FormLabel><FormControl><Textarea placeholder="e.g., Modern, minimalist, clean, with a focus on high-quality product photography." {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="writingTone" render={({ field }) => (
                            <FormItem><FormLabel>Writing Tone</FormLabel><FormControl><Textarea placeholder="e.g., Friendly, approachable, and slightly witty. Uses emojis sparingly." {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="contentThemes" render={({ field }) => (
                            <FormItem><FormLabel>Content Themes</FormLabel><FormControl><Textarea placeholder="e.g., Behind-the-scenes, customer spotlights, new product announcements." {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>
                     <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-3">
                        <FormField control={form.control} name="primaryColor" render={({ field }) => (<FormItem><FormLabel>Primary Color</FormLabel><FormControl><Input type="color" {...field} className="h-10 p-1"/></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="accentColor" render={({ field }) => (<FormItem><FormLabel>Accent Color</FormLabel><FormControl><Input type="color" {...field} className="h-10 p-1"/></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="backgroundColor" render={({ field }) => (<FormItem><FormLabel>Background Color</FormLabel><FormControl><Input type="color" {...field} className="h-10 p-1"/></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>Services & Audience</CardTitle>
                <CardDescription>Help the AI understand what you sell and who you sell it to.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <FormField control={form.control} name="services" render={({ field }) => (
                    <FormItem><FormLabel>Services / Products</FormLabel><FormDescription>List each service or product on a new line.</FormDescription><FormControl><Textarea placeholder="e.g., Haircuts\nManicures\nPedicures" {...field} className="h-24" /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="keyFeatures" render={({ field }) => (
                    <FormItem><FormLabel>Key Features</FormLabel><FormDescription>List the most important features of your offerings, one per line.</FormDescription><FormControl><Textarea placeholder="e.g., Uses organic products\nOnline booking available\nFree consultations" {...field} className="h-24" /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="targetAudience" render={({ field }) => (
                    <FormItem><FormLabel>Target Audience</FormLabel><FormControl><Textarea placeholder="e.g., Young professionals aged 25-40, environmentally conscious, living in the downtown area." {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="competitiveAdvantages" render={({ field }) => (
                    <FormItem><FormLabel>Competitive Advantages</FormLabel><FormDescription>What makes you different? List one per line.</FormDescription><FormControl><Textarea placeholder="e.g., Open late on weekends\nAward-winning stylists\nLoyalty program" {...field} className="h-24" /></FormControl><FormMessage /></FormItem>
                )}/>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Provide contact details for the AI to use when appropriate.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="contactPhone" render={({ field }) => (
                    <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="(555) 123-4567" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="contactEmail" render={({ field }) => (
                    <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="contact@yourbusiness.com" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="contactAddress" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Address</FormLabel><FormControl><Input placeholder="123 Main St, Anytown, USA" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSaving}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : (initialProfile ? "Save Changes" : "Save Brand Profile & Continue")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
