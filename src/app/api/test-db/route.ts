import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
    try {
        const { userId, testData } = await request.json();
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        console.log("🧪 Testing database connection for userId:", userId);
        
        // Check current auth user
        const currentUser = auth.currentUser;
        console.log("👤 Current auth user:", currentUser?.uid, currentUser?.email);
        
        // Test document reference
        const testRef = doc(db, "test", userId);
        console.log("📄 Test reference created:", testRef.path);
        
        // Try to write test data
        const testDoc = {
            userId: userId,
            timestamp: new Date().toISOString(),
            testData: testData || "Hello from test",
            source: "api-test"
        };
        
        console.log("💾 Attempting to save test document...");
        await setDoc(testRef, testDoc);
        console.log("✅ Test document saved successfully!");
        
        // Try to read it back
        console.log("📖 Attempting to read test document...");
        const docSnap = await getDoc(testRef);
        
        if (docSnap.exists()) {
            console.log("✅ Test document read successfully!");
            const data = docSnap.data();
            
            return NextResponse.json({ 
                success: true, 
                message: 'Database test completed successfully',
                writtenData: testDoc,
                readData: data,
                authUser: {
                    uid: currentUser?.uid,
                    email: currentUser?.email
                }
            });
        } else {
            console.log("❌ Test document not found after write");
            return NextResponse.json({ 
                success: false, 
                error: 'Document not found after write' 
            }, { status: 500 });
        }
        
    } catch (error) {
        console.error("❌ Database test failed:", error);
        console.error("Error code:", (error as any).code);
        console.error("Error message:", (error as any).message);
        
        return NextResponse.json({ 
            success: false, 
            error: (error as any).message,
            code: (error as any).code
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ 
        message: 'Database Test Endpoint',
        usage: 'POST with { "userId": "test-user-id", "testData": "optional test data" }'
    });
}
