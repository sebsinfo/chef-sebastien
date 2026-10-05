import { createClient } from '@supabase/supabase-js';
import type { AppSettings, Feedback, FeedbackStatus, Profile, Question, ServiceItem } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wdtvesrkbybvihbskond.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_kssguoe3gjCjrWrLCjriMg_sVoIIEwn';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseAnonKey.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Valeurs par défaut initiales pour le restaurant Chef Sébastien
export const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  business_name: 'Chef Sébastien',
  logo_url: '',
  welcome_message: 'Bienvenue chez Chef Sébastien. L’excellence gastronomique et la satisfaction de nos convives sont au cœur de nos priorités.',
  whatsapp_number: '50937000000',
  support_message: 'Bonjour Chef Sébastien, je souhaite parler à un conseiller concernant un service.',
  reply_template: 'Bonjour {prénom}, merci pour votre message.',
  feedback_phone_required: false,
};

export const DEFAULT_SERVICES: ServiceItem[] = [
  { id: '729fdff4-2bb3-4c9b-be0c-326d88997e35', name: 'Restaurant & Salle', is_active: true, sort_order: 1 },
  { id: '529c9637-44b1-43d2-aefc-3b0aefee08f3', name: 'Service Traiteur & Réceptions', is_active: true, sort_order: 2 },
  { id: 'bc0f4fd4-b2a9-4cab-9e7b-9e5e5d724481', name: 'Plats à emporter / Livraison', is_active: true, sort_order: 3 },
  { id: '98c41fad-a7d1-4b40-92d5-c8f27645e238', name: 'Chef à Domicile', is_active: true, sort_order: 4 },
  { id: '9df174bc-1b74-4ce8-9a0d-8ac343efc0fa', name: 'Événements privés & Corporate', is_active: true, sort_order: 5 },
];

// Stockage local de secours (utilisé si la base n'est pas encore migrée ou en cas de hors-ligne)
const LOCAL_STORAGE_KEYS = {
  FEEDBACK: 'chef_sebastien_feedback',
  QUESTIONS: 'chef_sebastien_questions',
  SERVICES: 'chef_sebastien_services',
  SETTINGS: 'chef_sebastien_settings',
  ADMINS: 'chef_sebastien_admins',
};

function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Erreur localStorage', err);
  }
}

// Nettoyage des anciennes clés de test locales
try {
  localStorage.removeItem('chef_sebastien_active_user_profile');
  localStorage.removeItem('chef_sebastien_is_demo_session');
} catch {}

/**
 * Service API qui interroge directement Supabase
 */
export const api = {
  // Récupérer les paramètres du restaurant
  async getSettings(): Promise<AppSettings> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        setLocalData(LOCAL_STORAGE_KEYS.SETTINGS, data);
        return data as AppSettings;
      }
    } catch {
      // Ignorer l'erreur réseau et passer au local
    }
    return getLocalData<AppSettings>(LOCAL_STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  // Mettre à jour les paramètres (Super Admin)
  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings, updated_at: new Date().toISOString() };

    try {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ id: 1, ...updated })
        .select()
        .single();

      if (!error && data) {
        setLocalData(LOCAL_STORAGE_KEYS.SETTINGS, data);
        return data as AppSettings;
      }
    } catch {
      // mode fallback
    }

    setLocalData(LOCAL_STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  // Récupérer les services actifs
  async getActiveServices(): Promise<ServiceItem[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as ServiceItem[];
      }
    } catch {
      // fallback
    }

    const local = getLocalData<ServiceItem[]>(LOCAL_STORAGE_KEYS.SERVICES, DEFAULT_SERVICES);
    return local.filter(s => s.is_active).sort((a, b) => a.sort_order - b.sort_order);
  },

  // Récupérer tous les services (Admin)
  async getAllServices(): Promise<ServiceItem[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setLocalData(LOCAL_STORAGE_KEYS.SERVICES, data);
        return data as ServiceItem[];
      }
    } catch {
      // fallback
    }

    return getLocalData<ServiceItem[]>(LOCAL_STORAGE_KEYS.SERVICES, DEFAULT_SERVICES);
  },

  // Enregistrer ou modifier un service
  async saveService(service: Partial<ServiceItem>): Promise<ServiceItem> {
    try {
      if (service.id && !service.id.startsWith('temp-')) {
        const { data, error } = await supabase
          .from('services')
          .update({
            name: service.name,
            is_active: service.is_active,
            sort_order: service.sort_order,
          })
          .eq('id', service.id)
          .select()
          .single();

        if (!error && data) return data as ServiceItem;
      } else {
        const { data, error } = await supabase
          .from('services')
          .insert({
            name: service.name,
            is_active: service.is_active ?? true,
            sort_order: service.sort_order ?? 99,
          })
          .select()
          .single();

        if (!error && data) return data as ServiceItem;
      }
    } catch {
      // fallback
    }

    // Gestion locale
    const list = getLocalData<ServiceItem[]>(LOCAL_STORAGE_KEYS.SERVICES, DEFAULT_SERVICES);
    let item: ServiceItem;
    if (service.id) {
      const index = list.findIndex(s => s.id === service.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...service } as ServiceItem;
        item = list[index];
      } else {
        item = { id: service.id, name: service.name || '', is_active: service.is_active ?? true, sort_order: service.sort_order ?? 99 };
        list.push(item);
      }
    } else {
      item = {
        id: `svc-${Date.now()}`,
        name: service.name || 'Nouveau service',
        is_active: service.is_active ?? true,
        sort_order: service.sort_order ?? (list.length + 1),
      };
      list.push(item);
    }
    setLocalData(LOCAL_STORAGE_KEYS.SERVICES, list);
    return item;
  },

  // Soumettre un avis client (Public - sans authentification)
  async submitFeedback(payload: {
    rating: number;
    service_id: string;
    comment: string;
    customer_name?: string;
    customer_phone?: string;
    image_url?: string;
  }): Promise<{ success: boolean; data?: Feedback; error?: string }> {
    // 1. Assurer un service_id au format UUID valide pour PostgreSQL
    let cleanServiceId: string | null = null;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.service_id);
    if (isUUID) {
      cleanServiceId = payload.service_id;
    } else {
      const activeServices = await this.getActiveServices();
      const matched = activeServices.find(s => s.id === payload.service_id);
      if (matched && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matched.id)) {
        cleanServiceId = matched.id;
      } else if (activeServices.length > 0 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activeServices[0].id)) {
        cleanServiceId = activeServices[0].id;
      }
    }

    const baseInsert: any = {
      rating: payload.rating,
      service_id: cleanServiceId,
      comment: payload.comment.trim(),
      customer_name: payload.customer_name?.trim() || null,
      customer_phone: payload.customer_phone?.trim() || null,
      status: 'pending',
    };

    try {
      if (payload.image_url) {
        // Tenter d'abord avec image_url
        const { error: imgErr } = await supabase
          .from('feedback')
          .insert({
            ...baseInsert,
            image_url: payload.image_url,
          });

        if (!imgErr) {
          console.log('Avis avec image enregistré avec succès dans Supabase !');
          return { success: true };
        }

        // Si la colonne n'est pas encore dans le cache PostgREST (PGRST204)
        console.warn('Sauvegarde de secours sans colonne image_url:', imgErr.message);
        const { error: retryErr } = await supabase
          .from('feedback')
          .insert({
            ...baseInsert,
            comment: `${payload.comment.trim()}\n\n[Photo justificative attachée]`,
          });

        if (!retryErr) {
          console.log('Avis enregistré avec succès dans Supabase !');
          return { success: true };
        } else {
          console.error('Erreur insertion avis Supabase:', retryErr.message);
        }
      } else {
        // Insertion propre sans image_url pour éviter toute anomalie de schéma
        const { error } = await supabase
          .from('feedback')
          .insert(baseInsert);

        if (!error) {
          console.log('Avis enregistré avec succès dans Supabase !');
          return { success: true };
        } else {
          console.error('Erreur insertion avis Supabase:', error.message);
        }
      }
    } catch (err: any) {
      console.warn('Exception insert feedback:', err);
    }

    // Sauvegarde locale de secours
    const services = await this.getAllServices();
    const serviceName = services.find(s => s.id === cleanServiceId || s.id === payload.service_id)?.name || 'Service';
    const newFeedback: Feedback = {
      id: `fb-${Date.now()}`,
      rating: payload.rating,
      service_id: cleanServiceId,
      service_name: serviceName,
      comment: payload.comment.trim(),
      customer_name: payload.customer_name?.trim() || null,
      customer_phone: payload.customer_phone?.trim() || null,
      image_url: payload.image_url || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const currentList = getLocalData<Feedback[]>(LOCAL_STORAGE_KEYS.FEEDBACK, []);
    setLocalData(LOCAL_STORAGE_KEYS.FEEDBACK, [newFeedback, ...currentList]);
    return { success: true, data: newFeedback };
  },

  // Soumettre une question client (Public - sans authentification)
  async submitQuestion(payload: {
    customer_name: string;
    customer_phone: string;
    question: string;
  }): Promise<{ success: boolean; data?: Question; error?: string }> {
    try {
      // Envoi direct dans Supabase sans .select() car RLS public n'a que le droit INSERT
      const { error } = await supabase
        .from('questions')
        .insert({
          customer_name: payload.customer_name.trim(),
          customer_phone: payload.customer_phone.trim(),
          question: payload.question.trim(),
          status: 'received',
        });

      if (!error) {
        console.log('Question enregistrée avec succès dans Supabase !');
        return { success: true };
      } else {
        console.warn('Erreur Supabase insert question:', error.message);
      }
    } catch (err: any) {
      console.warn('Exception insert question:', err);
    }

    // Sauvegarde locale de secours
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      customer_name: payload.customer_name.trim(),
      customer_phone: payload.customer_phone.trim(),
      question: payload.question.trim(),
      status: 'received',
      created_at: new Date().toISOString(),
      responded_at: null,
      responded_by: null,
    };

    const currentList = getLocalData<Question[]>(LOCAL_STORAGE_KEYS.QUESTIONS, []);
    setLocalData(LOCAL_STORAGE_KEYS.QUESTIONS, [newQuestion, ...currentList]);
    return { success: true, data: newQuestion };
  },

  // Récupérer la liste des avis (Dashboard Admin)
  async getFeedbackList(): Promise<Feedback[]> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const services = await this.getAllServices();
        const servicesMap: Record<string, string> = {};
        services.forEach(s => { servicesMap[s.id] = s.name; });

        const mapped: Feedback[] = data.map((item: any) => ({
          ...item,
          service_name: item.service_id ? (servicesMap[item.service_id] || 'Général') : 'Général',
        }));
        setLocalData(LOCAL_STORAGE_KEYS.FEEDBACK, mapped);
        return mapped;
      } else if (error) {
        console.warn('Erreur getFeedbackList Supabase:', error.message);
      }
    } catch (err) {
      console.warn('Exception getFeedbackList:', err);
    }

    return getLocalData<Feedback[]>(LOCAL_STORAGE_KEYS.FEEDBACK, []);
  },

  // Mettre à jour le statut d'un avis
  async updateFeedbackStatus(feedbackId: string, status: FeedbackStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', feedbackId);

      if (!error) {
        const list = getLocalData<Feedback[]>(LOCAL_STORAGE_KEYS.FEEDBACK, []);
        const idx = list.findIndex(f => f.id === feedbackId);
        if (idx !== -1) {
          list[idx].status = status;
          setLocalData(LOCAL_STORAGE_KEYS.FEEDBACK, list);
        }
        return true;
      }
    } catch {
      // fallback
    }

    const list = getLocalData<Feedback[]>(LOCAL_STORAGE_KEYS.FEEDBACK, []);
    const idx = list.findIndex(f => f.id === feedbackId);
    if (idx !== -1) {
      list[idx].status = status;
      list[idx].updated_at = new Date().toISOString();
      setLocalData(LOCAL_STORAGE_KEYS.FEEDBACK, list);
      return true;
    }
    return false;
  },

  // Récupérer les questions (Dashboard Admin)
  async getQuestionsList(): Promise<Question[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Récupérer les profils pour associer le nom de l'administrateur ayant répondu
        const responderIds = [...new Set(data.map((q: any) => q.responded_by).filter(Boolean))];
        let profilesMap: Record<string, string> = {};
        if (responderIds.length > 0) {
          try {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', responderIds);
            if (profiles) {
              profiles.forEach((p: any) => { profilesMap[p.id] = p.full_name; });
            }
          } catch {}
        }

        const mapped: Question[] = data.map((q: any) => ({
          ...q,
          responder_name: q.responded_by ? (profilesMap[q.responded_by] || 'Chef Sébastien') : null,
        }));
        setLocalData(LOCAL_STORAGE_KEYS.QUESTIONS, mapped);
        return mapped;
      } else if (error) {
        console.warn('Erreur getQuestionsList Supabase:', error.message);
      }
    } catch (err) {
      console.warn('Exception getQuestionsList:', err);
    }

    return getLocalData<Question[]>(LOCAL_STORAGE_KEYS.QUESTIONS, []);
  },

  // Répondre à une question (Appel de la fonction SQL mark_question_replied)
  async markQuestionReplied(questionId: string, responderProfile?: Profile | null): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('mark_question_replied', {
        question_id: questionId,
      });

      if (!error) {
        // Mettre à jour aussi localement
        const list = getLocalData<Question[]>(LOCAL_STORAGE_KEYS.QUESTIONS, []);
        const idx = list.findIndex(q => q.id === questionId);
        if (idx !== -1) {
          if (list[idx].status !== 'replied') {
            list[idx].status = 'replied';
            list[idx].responded_at = new Date().toISOString();
            list[idx].responded_by = responderProfile?.id || 'admin';
            list[idx].responder_name = responderProfile?.full_name || 'Admin Chef Sébastien';
            setLocalData(LOCAL_STORAGE_KEYS.QUESTIONS, list);
          }
        }
        return true;
      }
    } catch {
      // fallback si RPC non encore créée
    }

    // Mode résilient / local
    const list = getLocalData<Question[]>(LOCAL_STORAGE_KEYS.QUESTIONS, []);
    const idx = list.findIndex(q => q.id === questionId);
    if (idx !== -1) {
      if (list[idx].status !== 'replied') {
        list[idx].status = 'replied';
        list[idx].responded_at = new Date().toISOString();
        list[idx].responded_by = responderProfile?.id || 'admin-local';
        list[idx].responder_name = responderProfile?.full_name || 'Chef Sébastien';
        setLocalData(LOCAL_STORAGE_KEYS.QUESTIONS, list);
      }
      return true;
    }
    return false;
  },

  // Récupérer la liste des administrateurs (Super Admin)
  async getAdminsList(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Profile[];
      } else if (error) {
        console.error('Erreur getAdminsList Supabase:', error.message);
      }
    } catch (err) {
      console.error('Exception getAdminsList:', err);
    }

    return [];
  },

  // Mettre à jour un administrateur (rôle, can_reply, status)
  async updateAdmin(profileId: string, updates: Partial<Profile>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (!error) {
        return true;
      } else {
        console.error('Erreur updateAdmin Supabase:', error.message);
      }
    } catch (err) {
      console.error('Exception updateAdmin:', err);
    }
    return false;
  },

  // Créer un administrateur (Directement via Supabase Auth + Profils)
  async createAdmin(payload: {
    full_name: string;
    email: string;
    password?: string;
    role: 'super_admin' | 'admin';
    can_reply: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanName = payload.full_name.trim();
    const tempPassword = payload.password?.trim() || 'Chef2026!';

    try {
      // 1. Inscrire l'utilisateur dans Supabase Auth avec un client isolé (sans affecter la session actuelle)
      const isolatedAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { data: authData, error: authError } = await isolatedAuthClient.auth.signUp({
        email: cleanEmail,
        password: tempPassword,
        options: {
          data: {
            full_name: cleanName,
            role: payload.role,
            can_reply: payload.can_reply,
          },
        },
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        // Si l'utilisateur est déjà inscrit dans auth.users
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already registered')) {
          const { error: updateErr } = await supabase
            .from('profiles')
            .update({
              full_name: cleanName,
              role: payload.role,
              can_reply: payload.can_reply,
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('email', cleanEmail);

          if (!updateErr) {
            return { success: true };
          }
        }

        // Si le quota d'emails Supabase SMTP est dépassé
        if (msg.includes('rate limit')) {
          return {
            success: false,
            error: "Limite d'envoi d'emails Supabase atteinte temporairement. Vous pouvez désactiver l'option 'Confirm email' dans Supabase (Auth > Providers > Email) ou créer l'administrateur dans la console Supabase.",
          };
        }

        return {
          success: false,
          error: authError.message || 'Impossible de créer le compte administrateur.',
        };
      }

      // 2. Créer ou mettre à jour le profil dans public.profiles avec l'ID Supabase Auth
      if (authData?.user?.id) {
        const userId = authData.user.id;
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            full_name: cleanName,
            email: cleanEmail,
            role: payload.role,
            status: 'active',
            can_reply: payload.can_reply,
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.warn('Note création profil:', profileError.message);
        }

        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de la création de l’administrateur.' };
    }
  },

  // Tester la connexion Supabase et vérifier les tables
  async testConnection(): Promise<{
    connected: boolean;
    tablesDetected: {
      profiles: boolean;
      feedback: boolean;
      questions: boolean;
      services: boolean;
      settings: boolean;
    };
    error?: string;
  }> {
    const result = {
      connected: false,
      tablesDetected: {
        profiles: false,
        feedback: false,
        questions: false,
        services: false,
        settings: false,
      },
      error: undefined as string | undefined,
    };

    const isTablePresent = (res: any) => {
      if (!res.error) return true;
      // Code 42501 ou message RLS = la table existe et est bien protégée par RLS
      const msg = res.error?.message?.toLowerCase() || '';
      const code = res.error?.code;
      if (
        code === '42501' ||
        msg.includes('permission denied') ||
        msg.includes('row-level security') ||
        msg.includes('rls')
      ) {
        return true;
      }
      return false;
    };

    try {
      const [pRes, fRes, qRes, sRes, setRes] = await Promise.all([
        supabase.from('profiles').select('id').limit(1),
        supabase.from('feedback').select('id').limit(1),
        supabase.from('questions').select('id').limit(1),
        supabase.from('services').select('id').limit(1),
        supabase.from('settings').select('id').limit(1),
      ]);

      result.tablesDetected.profiles = isTablePresent(pRes);
      result.tablesDetected.feedback = isTablePresent(fRes);
      result.tablesDetected.questions = isTablePresent(qRes);
      result.tablesDetected.services = isTablePresent(sRes);
      result.tablesDetected.settings = isTablePresent(setRes);

      result.connected = isTablePresent(sRes) || isTablePresent(setRes) || isTablePresent(fRes);
    } catch (err: any) {
      result.error = err?.message || 'Erreur de connexion';
    }

    return result;
  },
};
