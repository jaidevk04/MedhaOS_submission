'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, requiresMFA, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [showMFA, setShowMFA] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      const result = await login({
        email,
        password,
        mfaToken: showMFA ? mfaToken : undefined,
      });

      if (result.requiresMFA) {
        setShowMFA(true);
      } else {
        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl">🏥</div>
          </div>
          <CardTitle className="text-2xl text-center gradient-text">
            MedhaOS Clinician Terminal
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to access your clinical workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!showMFA ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label htmlFor="mfaToken" className="text-sm font-medium">
                  Two-Factor Authentication Code
                </label>
                <Input
                  id="mfaToken"
                  type="text"
                  placeholder="000000"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value)}
                  required
                  disabled={isLoading}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : showMFA ? 'Verify Code' : 'Sign In'}
            </Button>

            {showMFA && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowMFA(false);
                  setMfaToken('');
                  clearError();
                }}
              >
                Back to Login
              </Button>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>For healthcare professionals only</p>
            <p className="mt-2">Need help? Contact IT support</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
