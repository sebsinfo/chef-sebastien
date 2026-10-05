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

-- Les admins actifs peuvent SUPPRIMER un avis
CREATE POLICY "Active admins can delete feedback"
  ON public.feedback
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

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
-- 6. SYNCHRONISATION AUTOMATIQUE DES COMPTES & PROFILS
-- ==============================================================================

-- Fonction et trigger pour synchroniser automatiquement les profils administrateurs
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role TEXT;
  assigned_can_reply BOOLEAN;
  assigned_name TEXT;
BEGIN
  -- Déterminer le rôle
  IF lower(NEW.email) = 'informatiquechefsebastien@gmail.com' THEN
    assigned_role := 'super_admin';
    assigned_can_reply := true;
    assigned_name := 'Chef Sébastien (Direction)';
  ELSE
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
    assigned_can_reply := COALESCE((NEW.raw_user_meta_data->>'can_reply')::boolean, true);
    assigned_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, status, can_reply)
  VALUES (NEW.id, assigned_name, lower(NEW.email), assigned_role, 'active', assigned_can_reply)
  ON CONFLICT (id) DO UPDATE
  SET full_name = CASE WHEN profiles.full_name IS NOT NULL AND profiles.full_name <> '' THEN profiles.full_name ELSE EXCLUDED.full_name END,
      role = CASE WHEN lower(NEW.email) = 'informatiquechefsebastien@gmail.com' THEN 'super_admin' ELSE EXCLUDED.role END,
      status = 'active',
      can_reply = EXCLUDED.can_reply;

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
-- 7. CRÉATION DIRECTE D'ADMINISTRATEURS SANS ENVOI D'EMAIL (ANTI-RATE LIMIT)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_admin_user(
  admin_email TEXT,
  admin_password TEXT,
  admin_name TEXT,
  admin_role TEXT DEFAULT 'admin',
  admin_can_reply BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  clean_email TEXT := lower(trim(admin_email));
  existing_id UUID;
BEGIN
  -- Seul un Super Admin peut appeler cette fonction
  IF NOT public.is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée. Seul un Super Admin actif peut créer un administrateur.');
  END IF;

  -- Vérifier si l'utilisateur existe déjà dans auth.users
  SELECT id INTO existing_id FROM auth.users WHERE lower(email) = clean_email;

  IF existing_id IS NOT NULL THEN
    -- Mettre à jour son mot de passe et son profil sans envoyer d'email
    UPDATE auth.users
    SET encrypted_password = crypt(admin_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_build_object('full_name', admin_name, 'role', admin_role, 'can_reply', admin_can_reply),
        updated_at = now()
    WHERE id = existing_id;

    INSERT INTO public.profiles (id, full_name, email, role, status, can_reply)
    VALUES (existing_id, admin_name, clean_email, admin_role, 'active', admin_can_reply)
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        can_reply = EXCLUDED.can_reply,
        status = 'active';

    RETURN jsonb_build_object('success', true, 'user_id', existing_id, 'updated', true);
  END IF;

  -- Créer directement le compte pré-confirmé dans auth.users (zéro email envoyé, zéro rate limit !)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    clean_email,
    crypt(admin_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', admin_name, 'role', admin_role, 'can_reply', admin_can_reply),
    now(),
    now(),
    'authenticated',
    'authenticated',
    ''
  );

  -- Créer le profil associé
  INSERT INTO public.profiles (id, full_name, email, role, status, can_reply)
  VALUES (new_user_id, admin_name, clean_email, admin_role, 'active', admin_can_reply)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      can_reply = EXCLUDED.can_reply,
      status = 'active';

  RETURN jsonb_build_object('success', true, 'user_id', new_user_id);
END;
$$;

-- Forcer le rechargement immédiat du cache de schéma PostgREST dans Supabase
NOTIFY pgrst, 'reload schema';
-- ==============================================================================
