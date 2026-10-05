-- ==============================================================================
-- MIGRATION SUPABASE - CHEF SÉBASTIEN (Port-au-Prince, Haïti)
-- MVP « Feedback, Questions & Relation Client »
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLES
-- ==============================================================================

-- Table des profils administrateurs
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  can_reply BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des services du restaurant / traiteur
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des avis clients (feedback)
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajout rétro-compatible de image_url si la table existait déjà
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Table des questions clients (WhatsApp)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  question TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'replied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Table des paramètres (singleton: une seule ligne avec id = 1)
CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  business_name TEXT NOT NULL DEFAULT 'Chef Sébastien',
  logo_url TEXT DEFAULT '',
  welcome_message TEXT NOT NULL DEFAULT 'Bienvenue chez Chef Sébastien. L’excellence gastronomique et la satisfaction de nos convives sont au cœur de nos priorités.',
  whatsapp_number TEXT NOT NULL DEFAULT '50937000000',
  support_message TEXT NOT NULL DEFAULT 'Bonjour Chef Sébastien, je souhaite parler à un conseiller concernant un service.',
  reply_template TEXT NOT NULL DEFAULT 'Bonjour {prénom}, merci pour votre message.',
  feedback_phone_required BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. FONCTIONS UTILITAIRES & SÉCURITÉ
-- ==============================================================================

-- Vérifie si l'utilisateur connecté est un administrateur actif
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND status = 'active'
  );
$$;

-- Vérifie si l'utilisateur connecté est un Super Admin actif
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND status = 'active'
  );
$$;

-- Vérifie si l'utilisateur connecté peut répondre aux questions WhatsApp
CREATE OR REPLACE FUNCTION public.can_current_user_reply()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND status = 'active'
      AND (role = 'super_admin' OR can_reply = true)
  );
$$;

-- Fonction pour marquer une question comme répondue
-- Ne peut être appelée que par un admin actif avec droit de réponse
-- Si déjà 'replied', laisse responded_at et responded_by d'origine
CREATE OR REPLACE FUNCTION public.mark_question_replied(question_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  current_q RECORD;
BEGIN
  caller_id := auth.uid();

  -- 1. Contrôle des permissions
  IF NOT public.can_current_user_reply() THEN
    RAISE EXCEPTION 'Action non autorisée : permissions insuffisantes pour répondre aux questions.';
  END IF;

  -- 2. Vérification de l'existence de la question
  SELECT id, status, responded_at, responded_by INTO current_q
  FROM public.questions
  WHERE id = question_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question introuvable.';
  END IF;

  -- 3. Mise à jour seulement si la question était 'received'
  IF current_q.status = 'received' THEN
    UPDATE public.questions
    SET 
      status = 'replied',
      responded_at = now(),
      responded_by = caller_id
    WHERE id = question_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'question_id', question_id,
    'status', 'replied'
  );
END;
$$;

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- --- RLS : PROFILES ---
-- Chaque admin actif peut lire son propre profil
CREATE POLICY "Admins can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_super_admin());

-- Les admins actifs peuvent lire les noms des collègues ayant répondu
CREATE POLICY "Active admins can view profiles for reply signatures"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_active_admin());

-- Seul le Super Admin peut créer / modifier / désactiver des profils
CREATE POLICY "Super admin can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can update profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- --- RLS : SERVICES ---
-- Tout le monde (public non-authentifié) peut voir les services actifs
CREATE POLICY "Public can view active services"
  ON public.services
  FOR SELECT
  TO public
  USING (is_active = true);

-- Les admins actifs peuvent voir tous les services (actifs ou inactifs)
CREATE POLICY "Active admins can view all services"
  ON public.services
  FOR SELECT
  TO authenticated
  USING (public.is_active_admin());

-- Seul le Super Admin peut modifier les services
CREATE POLICY "Super admin can manage services"
  ON public.services
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- --- RLS : FEEDBACK ---
-- Tout le monde (public anon) peut SOUMETTRE un avis (INSERT uniquement)
CREATE POLICY "Public can submit feedback"
  ON public.feedback
  FOR INSERT
  TO public
  WITH CHECK (
    rating >= 1 AND rating <= 5 
    AND length(trim(comment)) > 0 
    AND length(comment) <= 3000
  );

-- Les admins actifs peuvent LIRE les avis
CREATE POLICY "Active admins can view feedback"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (public.is_active_admin());

-- Les admins actifs peuvent MODIFIER le statut des avis
CREATE POLICY "Active admins can update feedback status"
  ON public.feedback
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

-- --- RLS : QUESTIONS ---
-- Tout le monde (public anon) peut POSER une question (INSERT uniquement)
CREATE POLICY "Public can submit questions"
  ON public.questions
  FOR INSERT
  TO public
  WITH CHECK (
    length(trim(customer_name)) > 0 
    AND length(trim(customer_phone)) >= 8
    AND length(trim(question)) > 0
    AND length(question) <= 1500
  );

-- Les admins actifs peuvent LIRE toutes les questions
CREATE POLICY "Active admins can view questions"
  ON public.questions
  FOR SELECT
  TO authenticated
  USING (public.is_active_admin());

-- Note: Pas de politique UPDATE publique ni directe pour questions :
-- Le passage au statut 'replied' se fait UNIQUEMENT via la fonction SECURITY DEFINER `mark_question_replied` !

-- --- RLS : SETTINGS ---
-- Tout le monde peut LIRE les paramètres publics
CREATE POLICY "Public can view settings"
  ON public.settings
  FOR SELECT
  TO public
  USING (id = 1);

-- Seul le Super Admin peut MODIFIER les paramètres
CREATE POLICY "Super admin can update settings"
  ON public.settings
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ==============================================================================
-- 5. DONNÉES INITIALES (SEED)
-- ==============================================================================

-- Ligne unique de paramètres
INSERT INTO public.settings (
  id,
  business_name,
  logo_url,
  welcome_message,
  whatsapp_number,
  support_message,
  reply_template,
  feedback_phone_required
) VALUES (
  1,
  'Chef Sébastien',
  '',
  'Bienvenue chez Chef Sébastien. L’excellence gastronomique et la satisfaction de nos convives sont au cœur de nos priorités.',
  '50937000000',
  'Bonjour Chef Sébastien, je souhaite parler à un conseiller concernant un service.',
  'Bonjour {prénom}, merci pour votre message.',
  false
) ON CONFLICT (id) DO NOTHING;

-- Services initiaux du restaurant / traiteur
INSERT INTO public.services (name, is_active, sort_order)
VALUES
  ('Restaurant & Salle', true, 1),
  ('Service Traiteur & Réceptions', true, 2),
  ('Plats à emporter / Livraison', true, 3),
  ('Chef à Domicile', true, 4),
  ('Événements privés & Corporate', true, 5)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 6. SYNCHRONISATION AUTOMATIQUE DU SUPER ADMIN
-- ==============================================================================

-- Fonction et trigger pour synchroniser automatiquement le compte Super Admin
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'informatiquechefsebastien@gmail.com' THEN
    INSERT INTO public.profiles (id, full_name, email, role, status, can_reply)
    VALUES (NEW.id, 'Chef Sébastien (Direction)', NEW.email, 'super_admin', 'active', true)
    ON CONFLICT (id) DO UPDATE
    SET role = 'super_admin', status = 'active', can_reply = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Associer immédiatement le compte s'il est déjà créé dans auth.users
INSERT INTO public.profiles (id, full_name, email, role, status, can_reply)
SELECT id, 'Chef Sébastien (Direction)', email, 'super_admin', 'active', true
FROM auth.users
WHERE lower(email) = 'informatiquechefsebastien@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin', status = 'active', can_reply = true;
-- ==============================================================================
