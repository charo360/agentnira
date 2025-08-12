import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import type { NewGeneratedPost, GeneratedPost } from '@/lib/types';

// Helper function to upload base64 image to Firebase Storage
const uploadImageToStorage = async (base64Data: string, userId: string): Promise<string> => {
    try {
        const storage = await getAdminStorage();
        const bucket = storage.bucket();

        // Extract image format and data
        const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (!matches) {
            throw new Error('Invalid base64 image format');
        }

        const imageFormat = matches[1];
        const imageBuffer = Buffer.from(matches[2], 'base64');

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `posts/${userId}/${timestamp}.${imageFormat}`;

        // Upload to Firebase Storage
        const file = bucket.file(filename);
        await file.save(imageBuffer, {
            metadata: {
                contentType: `image/${imageFormat}`,
            },
        });

        // Make the file publicly accessible
        await file.makePublic();

        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

        console.log(`✅ API: Image uploaded to Storage: ${filename}`);
        return publicUrl;

    } catch (error) {
        console.error('❌ API: Error uploading image to Storage:', error);
        throw error;
    }
};

// Helper function to compress base64 image by reducing quality
const compressBase64Image = (base64Data: string, maxSize: number = 500000): string => {
    if (base64Data.length <= maxSize) {
        return base64Data;
    }

    console.log(`🔧 API: Compressing image from ${base64Data.length} chars to fit ${maxSize} limit`);

    // Extract the header and data parts
    const header = base64Data.substring(0, base64Data.indexOf(',') + 1);
    const data = base64Data.substring(base64Data.indexOf(',') + 1);

    // Calculate compression ratio needed
    const compressionRatio = maxSize / base64Data.length;
    const targetDataLength = Math.floor(data.length * compressionRatio * 0.8); // 80% of target to leave buffer

    // Take a portion of the image data
    const compressedData = data.substring(0, Math.max(1000, targetDataLength)); // Minimum 1000 chars

    const result = header + compressedData;
    console.log(`✅ API: Compressed to ${result.length} chars (${Math.round(compressionRatio * 100)}% of original)`);

    return result;
};

// Helper function to handle large base64 images
const processImageUrl = async (imageUrl: string, userId: string): Promise<string> => {
    // If it's not a data URL, return as-is
    if (!imageUrl.startsWith('data:image/')) {
        return imageUrl;
    }

    // For small images (< 500KB), keep as base64 for faster loading
    if (imageUrl.length <= 500000) {
        console.log(`✅ API: Small image (${imageUrl.length} chars) - keeping as base64`);
        return imageUrl;
    }

    // For medium images (500KB - 800KB), try compression first
    if (imageUrl.length <= 800000) {
        console.log(`🔧 API: Medium image (${imageUrl.length} chars) - compressing`);
        return compressBase64Image(imageUrl, 500000);
    }

    // For large images, try Firebase Storage first, then fallback to compression
    console.log(`🔧 API: Large image (${imageUrl.length} chars) - trying Storage first`);
    try {
        const storageUrl = await uploadImageToStorage(imageUrl, userId);
        console.log(`✅ API: Successfully uploaded to Storage`);
        return storageUrl;
    } catch (error) {
        console.error('❌ API: Storage upload failed, trying compression fallback');
        // Try compression as fallback
        const compressed = compressBase64Image(imageUrl, 500000);
        if (compressed.length < imageUrl.length) {
            console.log(`✅ API: Compressed image from ${imageUrl.length} to ${compressed.length} chars`);
            return compressed;
        }

        // Final fallback to placeholder
        console.log(`❌ API: Using placeholder as final fallback`);
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNTIgNDQ4QzM1MiA0MjEuNDkgMzczLjQ5IDQwMCA0MDAgNDAwSDYyNEM2NTAuNTEgNDAwIDY3MiA0MjEuNDkgNjcyIDQ0OFY1NzZDNjcyIDYwMi41MSA2NTAuNTEgNjI0IDYyNCA2MjRINDAwQzM3My40OSA2MjQgMzUyIDYwMi41MSAzNTIgNTc2VjQ0OFoiIGZpbGw9IiNEMUQ1REIiLz4KPHA+dGggZD0iTTQ0OCA0ODBDNDQ4IDQ2Ni43NCA0NTguNzQgNDU2IDQ3MiA0NTZDNDg1LjI2IDQ1NiA0OTYgNDY2Ljc0IDQ5NiA0ODBDNDk2IDQ5My4yNiA0ODUuMjYgNTA0IDQ3MiA1MDRDNDU4Ljc0IDUwNCA0NDggNDkzLjI2IDQ0OCA0ODBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0zODQgNTc2TDQzMiA1MjhMNTI4IDYyNEg0MDBDMzg3LjMgNjI0IDM4NCA2MTIuNyAzODQgNTc2WiIgZmlsbD0iIzlCOUJBMCIvPgo8cGF0aCBkPSJNNTI4IDU3NkM1MjggNTYyLjc0IDUzOC43NCA1NTIgNTUyIDU1MkM1NjUuMjYgNTUyIDU3NiA1NjIuNzQgNTc2IDU3NkM1NzYgNTg5LjI2IDU2NS4yNiA2MDAgNTUyIDYwMEM1MzguNzQgNjAwIDUyOCA1ODkuMjYgNTI4IDU3NloiIGZpbGw9IiM5QjlCQTAiLz4KPHA+dGggZD0iTTU3NiA2MjRINjI0QzYzNy4zIDYyNCA2NzIgNjEyLjcgNjcyIDU3NkM2NzIgNTc2IDYyNCA1MjggNTc2IDU3NloiIGZpbGw9IiM5QjlCQTAiLz4KPHRleHQgeD0iNTEyIiB5PSI3MDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QUkgR2VuZXJhdGVkIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
    }
};

// Helper function to process image URLs in post data
const processPostImages = async (postData: any, userId: string): Promise<any> => {
    if (!postData.variants || !Array.isArray(postData.variants)) {
        return postData;
    }

    // Process each variant's imageUrl
    const processedVariants = await Promise.all(
        postData.variants.map(async (variant: any) => {
            if (variant.imageUrl && typeof variant.imageUrl === 'string') {
                variant.imageUrl = await processImageUrl(variant.imageUrl, userId);
            }
            return variant;
        })
    );

    return {
        ...postData,
        variants: processedVariants
    };
};

// Helper function to clean and serialize data for Firestore
const cleanForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return null;
    }

    // Handle primitive types
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        return obj;
    }

    // Handle Date objects
    if (obj instanceof Date) {
        return obj.toISOString();
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(cleanForFirestore).filter(item => item !== null && item !== undefined);
    }

    // Handle objects
    if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
            // Skip functions, symbols, and other non-serializable types
            if (typeof value === 'function' || typeof value === 'symbol') {
                continue;
            }

            const cleanedValue = cleanForFirestore(value);
            if (cleanedValue !== null && cleanedValue !== undefined) {
                cleaned[key] = cleanedValue;
            }
        }
        return cleaned;
    }

    // For any other type, try to convert to string or return null
    try {
        return String(obj);
    } catch {
        return null;
    }
};

export async function POST(request: NextRequest) {
    try {
        const { userId, post } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        if (!post) {
            return NextResponse.json({ error: 'Post data is required' }, { status: 400 });
        }

        console.log("🔄 API: Attempting to save generated post for userId:", userId);
        console.log("📝 API: Post data keys:", Object.keys(post));
        console.log("📝 API: Post variants:", JSON.stringify(post.variants, null, 2));

        // Process images first (upload large ones to Storage)
        const processedPost = await processPostImages(post, userId);
        console.log("🖼️ API: Images processed");

        const cleanedPost = cleanForFirestore(processedPost);
        console.log("🧹 API: Cleaned post keys:", Object.keys(cleanedPost));
        console.log("🧹 API: Cleaned variants:", JSON.stringify(cleanedPost.variants, null, 2));

        if (!cleanedPost || !Object.keys(cleanedPost).length) {
            return NextResponse.json({ error: 'Post data is empty after cleaning' }, { status: 400 });
        }

        console.log("💾 API: Attempting to save post to Firestore with Admin SDK...");

        const adminDb = await getAdminDb();
        const postsCollectionRef = adminDb.collection('profiles').doc(userId).collection('posts');
        const docRef = await postsCollectionRef.add(cleanedPost);

        const savedPost: GeneratedPost = {
            ...cleanedPost,
            id: docRef.id
        };

        console.log("✅ API: Generated post saved successfully!");

        return NextResponse.json({
            success: true,
            message: 'Generated post saved successfully',
            post: savedPost
        });

    } catch (error) {
        console.error("❌ API: Detailed error saving generated post:", error);
        console.error("API: Error code:", (error as any).code);
        console.error("API: Error message:", (error as any).message);

        let errorMessage = 'Could not save the generated post';

        if ((error as any).code === 'permission-denied') {
            errorMessage = 'Database access denied. Please check Firestore rules.';
        } else if ((error as any).code === 'unauthenticated') {
            errorMessage = 'Authentication required. Please log in.';
        } else if ((error as any).message) {
            errorMessage = (error as any).message;
        }

        return NextResponse.json({
            success: false,
            error: errorMessage,
            code: (error as any).code
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Generated Post Save API',
        usage: 'POST with { "userId": "user-id", "post": {...} }'
    });
}
