import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { createChannel } from "@/actions/channels";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string()
    .min(2, "Channel name must be at least 2 characters")
    .max(50, "Channel name must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Channel name can only contain lowercase letters, numbers, and hyphens"),
});

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onSuccess?: () => void;
}

export function CreateChannelDialog({ 
  open, 
  onOpenChange, 
  workspaceId,
  onSuccess 
}: CreateChannelDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("🔥 [CreateChannel] START", { values, workspaceId });
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log("🔥 [CreateChannel] Creating channel...", { userId: user.id });
      const channel = await createChannel(values.name, workspaceId, user.id);
      console.log("🔥 [CreateChannel] SUCCESS", { channel });

      toast({
        title: "Channel created",
        description: `#${channel.name} has been created successfully.`,
      });

      form.reset();
      onOpenChange(false);
      console.log("🔥 [CreateChannel] Calling onSuccess callback");
      onSuccess?.();
      console.log("🔥 [CreateChannel] Navigating to channel", { channelId: channel.id });
      navigate(`/workspace/${workspaceId}/channel/${channel.id}`);
    } catch (error) {
      console.error("Error creating channel:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create channel",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Create a new channel to organize conversations by topic.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. general, random, announcements"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '-')
                          .replace(/-+/g, '-');
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Channel"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
