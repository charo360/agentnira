import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import type { BrandProfile } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        console.log("🔄 API: Attempting to fetch brand profile for userId:", userId);
        
        const adminDb = await getAdminDb();
        const profileDoc = await adminDb.collection('profiles').doc(userId).get();
        
        if (!profileDoc.exists) {
            console.log("📄 API: No profile found for user");
            return NextResponse.json({ 
                success: true, 
                profile: null,
                message: 'No profile found for user'
            });
        }
        
        const profile = profileDoc.data() as BrandProfile;
        console.log("✅ API: Brand profile fetched successfully!");
        
        return NextResponse.json({ 
            success: true, 
            profile: profile,
            message: 'Brand profile fetched successfully'
        });
        
    } catch (error) {
        console.error("❌ API: Detailed error fetching brand profile:", error);
        console.error("API: Error code:", (error as any).code);
        console.error("API: Error message:", (error as any).message);
        
        let errorMessage = 'Could not retrieve your brand profile';
        
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
        message: 'Brand Profile Fetch API',
        usage: 'POST with { "userId": "user-id" }'
    });
}
