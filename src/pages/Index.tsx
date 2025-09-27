import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ResearchDashboard from "@/components/ResearchDashboard";
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <ResearchDashboard />;
};

export default Index;
