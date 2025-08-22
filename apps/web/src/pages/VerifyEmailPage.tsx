import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    // Call the verification endpoint
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: 'GET',
          credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to verify email');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error occurred while verifying email');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className="w-16 h-16 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-accent" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-secondary" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying Email...';
      case 'success':
        return 'Email Verified!';
      case 'error':
        return 'Verification Failed';
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="app-container py-8">
        <div className="col-span-12 max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {getIcon()}
              </div>
              <CardTitle className="text-2xl">{getTitle()}</CardTitle>
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">{message}</p>
              
              {status === 'success' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Redirecting to dashboard in a few seconds...
                  </p>
                  <Button onClick={() => navigate('/dashboard')}>
                    Go to Dashboard Now
                  </Button>
                </div>
              )}
              
              {status === 'error' && (
                <div className="space-y-3">
                  <Button onClick={() => navigate('/login')}>
                    Back to Login
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}