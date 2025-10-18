import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/app";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch user data
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (userData?.workspaces && userData.workspaces.length > 0) {
        // Redirect to first workspace
        navigate(`/workspace/${userData.workspaces[0]}`);
      } else {
        // No workspaces, redirect to create one
        navigate("/create-workspace");
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return null;
};

export default Index;
