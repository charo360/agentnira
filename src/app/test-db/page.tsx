"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";

export default function TestDbPage() {
    const [user, loading] = useAuthState(auth);
    const [testResults, setTestResults] = useState<string[]>([]);
    const [isTestRunning, setIsTestRunning] = useState(false);

    const addResult = (message: string) => {
        setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const runDatabaseTests = async () => {
        if (!user) {
            addResult("❌ No user logged in");
            return;
        }

        setIsTestRunning(true);
        setTestResults([]);
        
        try {
            addResult("🔍 Starting database connectivity tests...");
            addResult(`👤 User ID: ${user.uid}`);
            addResult(`📧 User Email: ${user.email}`);

            // Test 1: Try to read from profiles collection
            addResult("📖 Test 1: Reading from profiles collection...");
            try {
                const profileRef = doc(db, "profiles", user.uid);
                addResult(`📄 Profile document path: ${profileRef.path}`);
                
                const docSnap = await getDoc(profileRef);
                addResult(`✅ Read operation successful. Document exists: ${docSnap.exists()}`);
                
                if (docSnap.exists()) {
                    addResult(`📊 Document data: ${JSON.stringify(docSnap.data(), null, 2)}`);
                }
            } catch (error: any) {
                addResult(`❌ Read failed: ${error.code} - ${error.message}`);
            }

            // Test 2: Try to write to profiles collection
            addResult("✏️ Test 2: Writing to profiles collection...");
            try {
                const testData = {
                    testField: "test-value",
                    timestamp: new Date().toISOString(),
                    userId: user.uid
                };
                
                const profileRef = doc(db, "profiles", user.uid);
                await setDoc(profileRef, testData, { merge: true });
                addResult("✅ Write operation successful");
            } catch (error: any) {
                addResult(`❌ Write failed: ${error.code} - ${error.message}`);
            }

            // Test 3: Try to create a document in a subcollection
            addResult("📝 Test 3: Writing to subcollection...");
            try {
                const postsRef = collection(db, "profiles", user.uid, "posts");
                const testPost = {
                    title: "Test Post",
                    content: "This is a test post",
                    timestamp: new Date().toISOString()
                };
                
                const docRef = await addDoc(postsRef, testPost);
                addResult(`✅ Subcollection write successful. Doc ID: ${docRef.id}`);
            } catch (error: any) {
                addResult(`❌ Subcollection write failed: ${error.code} - ${error.message}`);
            }

            addResult("🏁 Database tests completed");
            
        } catch (error: any) {
            addResult(`💥 Unexpected error: ${error.message}`);
        } finally {
            setIsTestRunning(false);
        }
    };

    if (loading) {
        return <div className="p-4">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Database Test</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Please log in first to test database connectivity.</p>
                        <Button onClick={() => window.location.href = '/login'} className="mt-4">
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Firestore Database Test</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Button 
                            onClick={runDatabaseTests} 
                            disabled={isTestRunning}
                            className="w-full"
                        >
                            {isTestRunning ? "Running Tests..." : "Run Database Tests"}
                        </Button>
                        
                        {testResults.length > 0 && (
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <h3 className="font-semibold mb-2">Test Results:</h3>
                                <div className="space-y-1 font-mono text-sm">
                                    {testResults.map((result, index) => (
                                        <div key={index} className="whitespace-pre-wrap">
                                            {result}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
