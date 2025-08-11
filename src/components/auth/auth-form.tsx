// src/components/auth/auth-form.tsx
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 173.4 54.7l-76.2 64.9C308.6 92.6 279.2 80 248 80c-81.6 0-147.4 65.8-147.4 176s65.8 176 147.4 176c88.3 0 126.9-63.3 131.7-93.5H248v-95.6h239.9c1.4 9.3 2.1 18.9 2.1 28.5z"></path>
    </svg>
);


export function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const { toast } = useToast();

    const handleAuthAction = async (action: 'email' | 'google') => {
        setIsLoading(true);
        try {
            if (action === 'google') {
                const provider = new GoogleAuthProvider();
                await signInWithPopup(auth, provider);
            } else {
                if (isLogin) {
                    await signInWithEmailAndPassword(auth, email, password);
                } else {
                    await createUserWithEmailAndPassword(auth, email, password);
                }
            }
            toast({
                title: isLogin ? "Login Successful!" : "Account Created!",
                description: "You are now logged in.",
            });
            router.push('/brand-profile');
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Authentication Failed",
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleAuthAction('email');
    };

    return (
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader>
                <CardTitle className="text-2xl">{isLogin ? 'Login' : 'Sign Up'}</CardTitle>
                <CardDescription>
                    {isLogin ? 'Enter your email below to login to your account' : 'Create an account to get started'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                             {isLogin && (
                                <a href="#" className="ml-auto inline-block text-sm underline">
                                    Forgot your password?
                                </a>
                             )}
                        </div>
                        <Input 
                            id="password" 
                            type="password" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                         {isLogin ? 'Login' : 'Create an account'}
                    </Button>
                    <Button variant="outline" className="w-full" type="button" disabled={isLoading} onClick={() => handleAuthAction('google')}>
                        <GoogleIcon />
                        {isLogin ? 'Login with Google' : 'Sign up with Google'}
                    </Button>
                </form>
                <div className="mt-4 text-center text-sm">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setIsLogin(!isLogin)} className="underline ml-1">
                        {isLogin ? 'Sign up' : 'Login'}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
