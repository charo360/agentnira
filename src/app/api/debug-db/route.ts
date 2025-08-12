import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        console.log("🔍 DEBUG: Checking database for userId:", userId);
        
        const adminDb = await getAdminDb();
        
        // Check if profile exists
        const profileDoc = await adminDb.collection('profiles').doc(userId).get();
        const profileExists = profileDoc.exists;
        const profileData = profileExists ? profileDoc.data() : null;
        
        console.log("📄 Profile exists:", profileExists);
        if (profileExists) {
            console.log("📄 Profile keys:", Object.keys(profileData || {}));
            console.log("📄 Profile businessName:", profileData?.businessName);
        }
        
        // Check posts collection
        const postsCollection = adminDb.collection('profiles').doc(userId).collection('posts');
        const postsSnapshot = await postsCollection.get();
        const postsCount = postsSnapshot.size;
        
        console.log("📝 Posts count:", postsCount);
        
        const posts: any[] = [];
        postsSnapshot.forEach((doc) => {
            const postData = doc.data();
            posts.push({
                id: doc.id,
                ...postData,
                // Check if imageText exists and its length
                imageTextLength: postData.imageText ? postData.imageText.length : 0,
                hasVariants: Array.isArray(postData.variants) && postData.variants.length > 0
            });
            console.log(`📝 Post ${doc.id}:`, {
                content: postData.content?.substring(0, 50) + '...',
                hashtags: postData.hashtags,
                imageTextLength: postData.imageText ? postData.imageText.length : 0,
                variantsCount: Array.isArray(postData.variants) ? postData.variants.length : 0
            });
        });
        
        // Check all profiles (to see what users exist)
        const allProfilesSnapshot = await adminDb.collection('profiles').get();
        const allUserIds: string[] = [];
        allProfilesSnapshot.forEach((doc) => {
            allUserIds.push(doc.id);
        });
        
        console.log("👥 All user IDs in database:", allUserIds);
        
        return NextResponse.json({ 
            success: true,
            debug: {
                userId: userId,
                profileExists: profileExists,
                profileData: profileData,
                postsCount: postsCount,
                posts: posts,
                allUserIds: allUserIds
            },
            message: `Debug complete for user ${userId}`
        });
        
    } catch (error) {
        console.error("❌ DEBUG: Error checking database:", error);
        return NextResponse.json({ 
            success: false, 
            error: (error as any).message 
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ 
        message: 'Database Debug API',
        usage: 'POST with { "userId": "user-id" }'
    });
}
