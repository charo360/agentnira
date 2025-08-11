export type Platform = 'Facebook' | 'Instagram' | 'LinkedIn' | 'Twitter';

export type BrandProfile = {
  businessName: string;
  businessType: string;
  location: string;
  logoDataUrl: string;
  visualStyle: string;
  writingTone: string;
  contentThemes: string;
  
  // New detailed fields
  websiteUrl?: string;
  description?: string;
  services?: string; // Storing as a newline-separated string for simplicity in UI
  targetAudience?: string;
  keyFeatures?: string; // Storing as a newline-separated string
  competitiveAdvantages?: string; // Storing as a newline-separated string
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };

  // Theme colors remain
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
};

export type GeneratedPost = {
  id: string;
  date: string;
  content: string;
  hashtags: string;
  status: 'generated' | 'edited' | 'posted';
  variants: {
    platform: Platform;
    imageUrl: string;
  }[];
  imageText: string;
  videoUrl?: string;
};

// A version of the post for creation where the ID is not yet known
export type NewGeneratedPost = Omit<GeneratedPost, 'id'>;


export type BrandAnalysisResult = {
  visualStyle: string;
  writingTone: string;
  contentThemes: string;
  // New analysis fields
  description: string;
  services: string;
  contactInfo: {
      phone?: string;
      email?: string;
      address?: string;
  };
};

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  maskDataUrl?: string | null;
}

export type CreativeAsset = {
  imageUrl: string | null;
  videoUrl: string | null;
  aiExplanation: string;
};
