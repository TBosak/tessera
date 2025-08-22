import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Input } from '../components/Input';
import { authApi, ApiError } from '../lib/api';
import { useToast } from '../components/Toaster';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationEmailFrom, setVerificationEmailFrom] = useState('');
  
  const navigate = useNavigate();
  const { addToast } = useToast();

  const authMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => 
      isLogin ? authApi.login(data.email, data.password) : authApi.register(data.email, data.password),
    onSuccess: (data) => {
      if (isLogin) {
        addToast({
          variant: 'success',
          message: 'Welcome back!'
        });
        navigate('/dashboard');
      } else {
        // Registration
        if (data.needs_verification) {
          setVerificationPending(true);
          setVerificationEmailFrom(data.verification_email_from || 'noreply@tessera.vote');
          addToast({
            variant: 'info',
            message: `${data.message} Please check your email (from ${data.verification_email_from}) to verify your account.`,
            duration: 8000  // Longer duration for important info
          });
          // Don't navigate to dashboard if verification is needed
        } else {
          addToast({
            variant: 'success',
            message: 'Account created successfully!'
          });
          navigate('/dashboard');
        }
      }
    },
    onError: (error: ApiError) => {
      if (error.fieldErrors) {
        setErrors(error.fieldErrors);
      } else {
        addToast({
          variant: 'error',
          message: error.message
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (!isLogin && password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    authMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{isLogin ? 'Sign In' : 'Create Account'}</CardTitle>
            <p className="text-gray-600 mt-2">
              {isLogin ? 'Welcome back to Tessera' : 'Join Tessera to create elections'}
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email?.[0]}
                placeholder="your@email.com"
                required
              />
              
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password?.[0]}
                placeholder="Enter your password"
                required
              />
              
              <Button
                type="submit"
                className="w-full"
                disabled={authMutation.isPending}
              >
                {authMutation.isPending 
                  ? (isLogin ? 'Signing in...' : 'Creating account...') 
                  : (isLogin ? 'Sign In' : 'Create Account')
                }
              </Button>
            </form>
            
            {verificationPending && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Verification email sent!</strong>
                  <p className="mt-1">
                    Please check your email inbox for a verification message from{' '}
                    <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">
                      {verificationEmailFrom}
                    </code>
                  </p>
                  <p className="mt-2 text-xs text-blue-600">
                    Don't see it? Check your spam folder or try registering again.
                  </p>
                </div>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                  setVerificationPending(false);
                  setVerificationEmailFrom('');
                }}
                className="text-primary hover:underline"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <Link to="/" className="text-gray-600 hover:underline">
                ← Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}