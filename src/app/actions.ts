// src/app/actions.ts
"use server";

import { analyzeBrand as analyzeBrandFlow, BrandAnalysisResult } from "@/ai/flows/analyze-brand";
import { generatePostFromProfile as generatePostFromProfileFlow } from "@/ai/flows/generate-post-from-profile";
import { generateVideoPost as generateVideoPostFlow } from "@/ai/flows/generate-video-post";
import { generateCreativeAsset as generateCreativeAssetFlow } from "@/ai/flows/generate-creative-asset";
import type { BrandProfile, GeneratedPost, Platform, CreativeAsset, NewGeneratedPost } from "@/lib/types";
import { db, auth } from "@/lib/firebase";
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

/**
 * Recursively removes keys with `undefined` values from an object.
 * This is crucial before sending data to Firestore, which doesn't allow `undefined`.
 * @param obj The object to clean.
 * @returns A new object with `undefined` values removed.
 */
const cleanUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return null;
    }

    if (Array.isArray(obj)) {
        return obj.map(v => cleanUndefined(v));
    }

    if (typeof obj !== 'object') {
        return obj;
    }

    const cleaned: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value !== undefined) {
                cleaned[key] = cleanUndefined(value);
            }
        }
    }

    return cleaned;
};


export async function saveBrandProfile(userId: string, profile: BrandProfile): Promise<void> {
    try {
        const profileRef = doc(db, "profiles", userId);
        const cleanedProfile = cleanUndefined(profile);

        if (!cleanedProfile || !Object.keys(cleanedProfile).length) {
            throw new Error("Profile data is empty after cleaning.");
        }

        await setDoc(profileRef, cleanedProfile, { merge: true });
    } catch (error) {
        console.error("Error saving brand profile:", error);
        throw new Error("Could not save your brand profile to the database.");
    }
}

export async function getBrandProfile(userId: string): Promise<BrandProfile | null> {
    try {
        console.log("Attempting to fetch brand profile for userId:", userId);

        // Ensure we have current auth context
        const currentUser = auth.currentUser;
        console.log("Current auth user:", currentUser?.uid, currentUser?.email);

        if (!currentUser) {
            console.error("No authenticated user found");
            throw new Error("User not authenticated");
        }

        const profileRef = doc(db, "profiles", userId);
        console.log("Profile reference created:", profileRef.path);

        const docSnap = await getDoc(profileRef);
        console.log("Document snapshot retrieved. Exists:", docSnap.exists());

        if (docSnap.exists()) {
            const data = docSnap.data() as BrandProfile;
            console.log("Profile data found:", data);
            return data;
        }
        console.log("No profile document found for user - this is normal for new users");
        return null;
    } catch (error) {
        console.error("Detailed error fetching brand profile:", error);
        console.error("Error code:", (error as any).code);
        console.error("Error message:", (error as any).message);
        console.error("Full error object:", error);

        // Check if it's a permissions error (common with Firestore rules)
        if ((error as any).code === 'permission-denied') {
            console.error("Permission denied - check Firestore rules");
            throw new Error("Database access denied. Please check your permissions.");
        }

        // For other errors, don't throw - just return null and let the user create a profile
        console.warn("Database error occurred, but allowing user to create new profile");
        return null;
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
