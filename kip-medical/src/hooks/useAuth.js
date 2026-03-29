import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isSupabaseEnabled) { setLoading(false); return; }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email) => {
    if (!isSupabaseEnabled) return { error: 'Supabase not configured' };
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    return { error };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseEnabled) return { error: 'Supabase not configured' };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseEnabled) return;
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, loading, error, isSupabaseEnabled, signInWithEmail, signInWithGoogle, signOut };
}
