'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { ProfileWithRoles } from '@/types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: ProfileWithRoles | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Fetch profile with roles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          area:areas(id, name),
          roles:user_roles!user_roles_user_id_fkey(role, area_id, dance_group_id, is_active)
        `)
        .eq('id', userId)
        .single();

      if (profileError) {
        // Profile doesn't exist yet - user needs to complete setup
        return null;
      }

      return profile as ProfileWithRoles;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      let profile = null;

      if (user) {
        profile = await fetchProfile(user.id);
      }

      setState({
        user,
        session,
        profile,
        isLoading: false,
        isAuthenticated: !!user,
      });
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      let profile = null;

      if (user) {
        profile = await fetchProfile(user.id);
      }

      setState({
        user,
        session,
        profile,
        isLoading: false,
        isAuthenticated: !!user,
      });
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/devotees/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshProfile = async () => {
    if (state.user) {
      const profile = await fetchProfile(state.user.id);
      setState((prev) => ({ ...prev, profile }));
    }
  };

  return {
    ...state,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };
}
