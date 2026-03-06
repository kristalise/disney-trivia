import { createBrowserClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';

export function getAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  }

  return createBrowserClient(url, key);
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = getAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = getAuthClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signUpAndSignIn(email: string, password: string) {
  const { data, error } = await signUpWithEmail(email, password);
  if (error) return { data, error };

  // If sign up returned a session, user is already logged in
  if (data.session) return { data, error: null };

  // If user exists with empty identities, the email is already registered
  if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
    return { data, error: new Error('An account with this email already exists. Please sign in instead.') };
  }

  // Sign up succeeded but no session — sign in with the new credentials
  return signInWithEmail(email, password);
}

export async function signInWithGoogle() {
  const supabase = getAuthClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
}

export async function signOut() {
  const supabase = getAuthClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function resetPassword(email: string) {
  const supabase = getAuthClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  return { data, error };
}
