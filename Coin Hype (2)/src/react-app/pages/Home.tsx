import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import LoadingScreen from '@/react-app/components/LoadingScreen';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to lobby after a short delay to show loading screen
    const timer = setTimeout(() => {
      navigate('/lobby');
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return <LoadingScreen />;
}
