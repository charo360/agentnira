// src/app/login/page.tsx
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/40">
        <AuthForm />
    </div>
  );
}
