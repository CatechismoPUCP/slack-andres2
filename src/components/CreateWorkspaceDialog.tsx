import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StandaloneImageUpload } from './StandaloneImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { generateSlug, generateInviteCode } from '@/lib/workspace-utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateWorkspaceDialog({ open, onOpenChange, onSuccess }: CreateWorkspaceDialogProps) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step === 1 && name.trim()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const slug = generateSlug(name);
      const inviteCode = generateInviteCode();

      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: name.trim(),
          slug,
          invite_code: inviteCode,
          super_admin: user.id,
          members: [user.id],
          image_url: imageUrl || null,
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      await supabase.rpc('add_workspace_to_user', {
        user_id: user.id,
        new_workspace: workspace.id,
      });

      toast.success('Workspace created successfully!');
      onOpenChange(false);
      setName('');
      setImageUrl('');
      setStep(1);
      onSuccess?.();
      navigate(`/workspace/${workspace.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a workspace</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Give your workspace a name' : 'Add a workspace image (optional)'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                placeholder="e.g. My Team Workspace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={handleNext} disabled={!name.trim()}>
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <StandaloneImageUpload value={imageUrl} onChange={setImageUrl} />
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Workspace'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
