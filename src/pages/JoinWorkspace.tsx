import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { workspaceInvite } from "@/actions/workspaces";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, AlertCircle } from "lucide-react";

export default function JoinWorkspace() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleInvite = async () => {
      if (!inviteCode) {
        setError("Invalid invite link");
        setLoading(false);
        return;
      }

      try {
        const workspace = await workspaceInvite(inviteCode);
        
        toast({
          title: "Success!",
          description: `You've joined ${workspace.name}`,
        });

        navigate(`/workspace/${workspace.id}`);
      } catch (err: any) {
        setError(err.message || "Failed to join workspace");
        setLoading(false);
      }
    };

    handleInvite();
  }, [inviteCode, navigate, toast]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <Card className="w-full max-w-md shadow-elegant">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Unable to Join</CardTitle>
            <CardDescription className="text-base">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-gradient-primary hover:shadow-glow transition-smooth"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
