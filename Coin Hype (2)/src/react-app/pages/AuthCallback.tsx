import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { Loader2 } from 'lucide-react';
import Logo from '@/react-app/components/Logo';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { exchangeCodeForSessionToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get stored referral code before auth
        const referralCode = localStorage.getItem('referralCode');
        
        await exchangeCodeForSessionToken();
        
        // Track referral signup if there was a referral code
        if (referralCode) {
          try {
            await fetch('/api/referrals/track-signup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ referralCode }),
            });
            // Clear referral code after successful tracking
            localStorage.removeItem('referralCode');
          } catch (err) {
            console.error('Failed to track referral:', err);
          }
        }
        
        navigate('/lobby');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="glass-panel p-8 max-w-md w-full mx-4 text-center">
        <Logo size="medium" />
        
        {error ? (
          <div className="mt-8">
            <p className="text-red-400 mb-4">{error}</p>
            <p className="text-gray-400 text-sm">Redirecting to home...</p>
          </div>
        ) : (
          <div className="mt-8">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
            <p className="text-gray-300">Completing authentication...</p>
          </div>
        )}
      </div>
    </div>
  );
}
