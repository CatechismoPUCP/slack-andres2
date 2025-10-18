import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/app";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, KeyRound } from "lucide-react";
import { JoinByCodeDialog } from "@/components/JoinByCodeDialog";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/auth");
          return;
        }

        // Check for pending invite code first
        const pendingInvite = sessionStorage.getItem('pendingInviteCode');
        if (pendingInvite) {
          navigate(`/join/${pendingInvite}`);
          return;
        }

        // Fetch user data
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user:", error);
          navigate("/create-workspace");
          return;
        }

        if (userData?.workspaces && userData.workspaces.length > 0) {
          // Redirect to first workspace
          navigate(`/workspace/${userData.workspaces[0]}`);
        } else {
          // No workspaces, stay on this page to show options
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in checkAuth:", error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/create-workspace")}>
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Create New Workspace</CardTitle>
            <CardDescription>
              Start fresh with your own workspace and invite team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg">
              Create Workspace
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setJoinDialogOpen(true)}>
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Join Workspace</CardTitle>
            <CardDescription>
              Have an invite code? Join an existing workspace instantly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" size="lg">
              Join with Code
            </Button>
          </CardContent>
        </Card>
      </div>

      <JoinByCodeDialog 
        open={joinDialogOpen} 
        onOpenChange={setJoinDialogOpen}
      />
    </div>
  );
};

export default Index;
