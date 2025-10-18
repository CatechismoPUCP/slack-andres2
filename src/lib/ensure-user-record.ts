import { supabase } from "@/integrations/supabase/client";

export async function ensureUserRecord() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Extract user metadata
    const name = 
      user.user_metadata?.full_name || 
      user.user_metadata?.name || 
      user.email?.split('@')[0] || 
      'Unknown User';
    
    const avatarUrl = 
      user.user_metadata?.avatar_url || 
      'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

    // Upsert user record into public.users
    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email!,
        name,
        avatar_url: avatarUrl,
      }, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      console.error('Error ensuring user record:', error);
    }
  } catch (error) {
    console.error('Error in ensureUserRecord:', error);
  }
}
