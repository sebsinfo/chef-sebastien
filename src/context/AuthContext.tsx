import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  canReply: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger le profil de l'utilisateur connecté depuis la table profiles de Supabase
  const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erreur récupération profil Supabase:', error.message);
        return null;
      }

      if (data) {
        const p = data as Profile;
        // Si le compte est marqué inactif, déconnexion immédiate de sécurité
        if (p.status !== 'active') {
          console.warn('Compte inactif détecté : accès révoqué.');
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          return null;
        }

        setProfile(p);
        return p;
      }
    } catch (err) {
      console.error('Exception profil Supabase:', err);
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } catch (e) {
        console.error('Erreur initAuth:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Écoute stricte des changements de session Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Authentification stricte via Supabase Auth uniquement
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        return { success: false, error: 'Identifiants invalides ou mot de passe incorrect.' };
      }

      if (data.user) {
        setUser(data.user);
        const userProfile = await fetchUserProfile(data.user.id);

        if (!userProfile) {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          return {
            success: false,
            error: 'Accès refusé : Ce compte n’est pas autorisé à accéder au tableau de bord.',
          };
        }

        return { success: true };
      }

      return { success: false, error: 'Connexion impossible.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Une erreur de connexion est survenue.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/admin/login`,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Échec de la réinitialisation.' };
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  // Règles de sécurité : vérification stricte du profil actif en base
  const isSuperAdmin = profile?.role === 'super_admin' && profile?.status === 'active';
  const isAdmin = profile?.status === 'active';
  const canReply = isSuperAdmin || (profile?.can_reply === true && profile?.status === 'active');

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isSuperAdmin: Boolean(isSuperAdmin),
        isAdmin: Boolean(isAdmin),
        canReply: Boolean(canReply),
        login,
        logout,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};
