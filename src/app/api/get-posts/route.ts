import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import type { GeneratedPost } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        console.log("🔄 API: Attempting to fetch posts for userId:", userId);
        
        const adminDb = await getAdminDb();
        const postsCollectionRef = adminDb.collection('profiles').doc(userId).collection('posts');
        const querySnapshot = await postsCollectionRef.orderBy('date', 'desc').get();
        
        const posts: GeneratedPost[] = [];
        querySnapshot.forEach((doc) => {
            posts.push({
                id: doc.id,
                ...doc.data()
            } as GeneratedPost);
        });
        
        console.log(`✅ API: Fetched ${posts.length} posts successfully!`);
        
        return NextResponse.json({ 
            success: true, 
            posts: posts,
            message: `Fetched ${posts.length} posts successfully`
        });
        
    } catch (error) {
        console.error("❌ API: Detailed error fetching posts:", error);
        console.error("API: Error code:", (error as any).code);
        console.error("API: Error message:", (error as any).message);
        
        let errorMessage = 'Could not retrieve your posts from the database';
        
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
        message: 'Generated Posts Fetch API',
        usage: 'POST with { "userId": "user-id" }'
    });
}
