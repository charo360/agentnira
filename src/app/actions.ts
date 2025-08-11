// src/app/actions.ts
"use server";

import { analyzeBrand as analyzeBrandFlow, BrandAnalysisResult } from "@/ai/flows/analyze-brand";
import { generatePostFromProfile as generatePostFromProfileFlow } from "@/ai/flows/generate-post-from-profile";
import { generateVideoPost as generateVideoPostFlow } from "@/ai/flows/generate-video-post";
import { generateCreativeAsset as generateCreativeAssetFlow } from "@/ai/flows/generate-creative-asset";
import type { BrandProfile, GeneratedPost, Platform, CreativeAsset, NewGeneratedPost } from "@/lib/types";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, addDoc, getDocs, updateDoc, query, orderBy } from "firebase/firestore";

// --- AI Flow Actions ---

export async function analyzeBrandAction(
  websiteUrl: string,
  designImageUris: string[],
): Promise<BrandAnalysisResult> {
  try {
    const result = await analyzeBrandFlow({ websiteUrl, designImageUris });
    return result;
  } catch (error) {
    console.error("Error analyzing brand:", error);
    throw new Error("Failed to analyze brand. Please check the URL and try again.");
  }
}

const getAspectRatioForPlatform = (platform: Platform): string => {
    switch (platform) {
        case 'Instagram':
            return '1:1'; // Square
        case 'Facebook':
            return '1:1'; // Square is highly compatible
        case 'Twitter':
            return '16:9'; // Landscape
        case 'LinkedIn':
            return '1:1'; // Square is recommended
        default:
            return '1:1';
    }
}

export async function generateContentAction(
  profile: BrandProfile,
  platform: Platform,
): Promise<NewGeneratedPost> {
  try {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const currentDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const postDetails = await generatePostFromProfileFlow({
      businessType: profile.businessType,
      location: profile.location,
      writingTone: profile.writingTone,
      contentThemes: profile.contentThemes,
      visualStyle: profile.visualStyle,
      logoDataUrl: profile.logoDataUrl,
      primaryColor: profile.primaryColor,
      accentColor: profile.accentColor,
      backgroundColor: profile.backgroundColor,
      dayOfWeek,
      currentDate,
      variants: [{
        platform: platform,
        aspectRatio: getAspectRatioForPlatform(platform),
      }],
      services: profile.services,
      targetAudience: profile.targetAudience,
      keyFeatures: profile.keyFeatures,
      competitiveAdvantages: profile.competitiveAdvantages,
    });

    const newPost: NewGeneratedPost = {
      date: today.toISOString(),
      content: postDetails.content,
      hashtags: postDetails.hashtags,
      status: 'generated',
      variants: postDetails.variants,
      imageText: postDetails.imageText,
    };

    return newPost;
  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error("Failed to generate content. Please try again later.");
  }
}

export async function generateVideoContentAction(
  profile: BrandProfile,
  imageText: string,
  postContent: string,
): Promise<{ videoUrl: string }> {
  try {
    const result = await generateVideoPostFlow({
      businessType: profile.businessType,
      location: profile.location,
      visualStyle: profile.visualStyle,
      imageText: imageText,
      postContent: postContent,
    });
    return { videoUrl: result.videoUrl };
  } catch (error) {
    console.error("Error generating video content:", error);
    throw new Error((error as Error).message);
  }
}

export async function generateCreativeAssetAction(
    prompt: string,
    outputType: 'image' | 'video',
    referenceAssetUrl: string | null,
    useBrandProfile: boolean,
    brandProfile: BrandProfile | null,
    maskDataUrl: string | null | undefined,
    aspectRatio: '16:9' | '9:16' | undefined
): Promise<CreativeAsset> {
    try {
        const result = await generateCreativeAssetFlow({
            prompt,
            outputType,
            referenceAssetUrl,
            useBrandProfile,
            brandProfile: useBrandProfile ? brandProfile : null,
            maskDataUrl,
            aspectRatio,
        });
        return result;
    } catch (error) {
        console.error("Error generating creative asset:", error);
        throw new Error((error as Error).message);
    }
}


// --- Firestore Actions ---

export async function saveBrandProfile(userId: string, profile: BrandProfile): Promise<void> {
    try {
        const profileRef = doc(db, "profiles", userId);
        await setDoc(profileRef, profile);
    } catch (error) {
        console.error("Error saving brand profile:", error);
        throw new Error("Could not save your brand profile to the database.");
    }
}

export async function getBrandProfile(userId: string): Promise<BrandProfile | null> {
    try {
        const profileRef = doc(db, "profiles", userId);
        const docSnap = await getDoc(profileRef);
        if (docSnap.exists()) {
            return docSnap.data() as BrandProfile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching brand profile:", error);
        throw new Error("Could not retrieve your brand profile from the database.");
    }
}

export async function saveGeneratedPost(userId: string, post: NewGeneratedPost): Promise<GeneratedPost> {
    try {
        const postsCollectionRef = collection(db, "profiles", userId, "posts");
        const docRef = await addDoc(postsCollectionRef, post);
        return { ...post, id: docRef.id };
    } catch (error) {
        console.error("Error saving generated post:", error);
        throw new Error("Could not save the generated post.");
    }
}

export async function updateGeneratedPost(userId: string, post: GeneratedPost): Promise<void> {
    try {
        const postRef = doc(db, "profiles", userId, "posts", post.id);
        await updateDoc(postRef, { ...post });
    } catch (error) {
        console.error("Error updating generated post:", error);
        throw new Error("Could not update the post.");
    }
}

export async function getGeneratedPosts(userId: string): Promise<GeneratedPost[]> {
    try {
        const postsCollectionRef = collection(db, "profiles", userId, "posts");
        const q = query(postsCollectionRef, orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GeneratedPost));
    } catch (error) {
        console.error("Error fetching generated posts:", error);
        throw new Error("Could not retrieve your posts from the database.");
    }
}
