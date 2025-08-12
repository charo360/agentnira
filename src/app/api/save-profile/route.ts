import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import type { BrandProfile } from '@/lib/types';

// Helper function to clean undefined values
const cleanUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return null;
    }

    if (Array.isArray(obj)) {
        return obj.map(cleanUndefined).filter(item => item !== undefined);
    }

    if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
            const cleanedValue = cleanUndefined(value);
            if (cleanedValue !== undefined) {
                cleaned[key] = cleanedValue;
            }
        }
        return cleaned;
    }

    return obj;
};

export async function POST(request: NextRequest) {
    try {
        const { userId, profile } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        if (!profile) {
            return NextResponse.json({ error: 'Profile data is required' }, { status: 400 });
        }

        console.log("🔄 API: Attempting to save brand profile for userId:", userId);
        console.log("📝 API: Profile data keys:", Object.keys(profile));

        const cleanedProfile = cleanUndefined(profile);
        console.log("🧹 API: Cleaned profile keys:", Object.keys(cleanedProfile));

        if (!cleanedProfile || !Object.keys(cleanedProfile).length) {
            return NextResponse.json({ error: 'Profile data is empty after cleaning' }, { status: 400 });
        }

        console.log("💾 API: Attempting to save to Firestore with Admin SDK...");

        const adminDb = await getAdminDb();
        await adminDb.collection('profiles').doc(userId).set(cleanedProfile, { merge: true });

        console.log("✅ API: Brand profile saved successfully!");

        return NextResponse.json({
            success: true,
            message: 'Brand profile saved successfully',
            profileId: userId
        });

    } catch (error) {
        console.error("❌ API: Detailed error saving brand profile:", error);
        console.error("API: Error code:", (error as any).code);
        console.error("API: Error message:", (error as any).message);

        let errorMessage = 'Could not save your brand profile';

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
        message: 'Brand Profile Save API',
        usage: 'POST with { "userId": "user-id", "profile": {...} }'
    });
}
