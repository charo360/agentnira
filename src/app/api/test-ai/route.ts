import { NextRequest, NextResponse } from 'next/server';
import { analyzeWebsiteAction } from '@/app/actions';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();
        
        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        console.log("🧪 Testing AI analysis for:", url);
        
        // Use a dummy user ID for testing
        const result = await analyzeWebsiteAction('test-user', url);
        
        return NextResponse.json({ 
            success: true, 
            result,
            message: 'AI analysis completed successfully'
        });
        
    } catch (error) {
        console.error("❌ AI test failed:", error);
        return NextResponse.json({ 
            success: false, 
            error: (error as Error).message 
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ 
        message: 'AI Website Analysis Test Endpoint',
        usage: 'POST with { "url": "https://example.com" }'
    });
}
