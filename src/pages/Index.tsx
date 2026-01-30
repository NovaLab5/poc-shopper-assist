import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to onboarding if not complete, otherwise to chat
    const onboardingComplete = localStorage.getItem('onboardingComplete') === 'true';
    if (onboardingComplete) {
      navigate('/chat');
    } else {
      navigate('/onboarding');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center">
      <div className="text-primary-600">Loading...</div>
    </div>
  );
}
