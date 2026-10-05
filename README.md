# Chef Sébastien — MVP « Feedback, Questions & Relation Client »

Plateforme web mobile-first de recueil d'avis clients, traitement de questions via WhatsApp et tableau de bord administrateur sécurisé avec statistiques pour **Chef Sébastien** (restaurant gastronomique et service traiteur à Port-au-Prince, Haïti).

---

## 1. Architecture & Principes Clés

> **« WhatsApp attire le client, le site collecte, Supabase stocke, le dashboard traite. »**

- **Frontend** : React 19 + TypeScript + Vite + Tailwind CSS + React Router v7 + Recharts.
- **Backend / BDD / Auth** : Supabase (PostgreSQL 15+, Row-Level Security, Supabase Auth, Deno Edge Function).
- **Communication Client** : Liens directs `https://wa.me/{numero}?text={message}` (aucun frais d'API WhatsApp).
- **QR Code** : Génération côté client (`qrcode.react`) avec téléchargement PNG pour impression sur tables, menus et comptoir.
- **Sécurité** : RLS stricte sur toutes les tables (le public ne peut que faire des `INSERT`, les admins ont accès selon leurs rôles et permissions).

---

## 2. Variables d'Environnement

Créez un fichier `.env` à la racine du projet (ou configurez ces variables dans les paramètres de votre projet Vercel) :

```env
# URL de votre projet Supabase
VITE_SUPABASE_URL="https://wdtvesrkbybvihbskond.supabase.co"

# Clé anonyme publique Supabase (Anon Key / Publishable Key)
VITE_SUPABASE_ANON_KEY="sb_publishable_kssguoe3gjCjrWrLCjriMg_sVoIIEwn"
```

---

## 3. Installation et Exécution Locale

```bash
# 1. Cloner le projet ou naviguer dans le dossier
cd chef-sebastien-mvp

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement Vite
npm run dev

# L'application sera accessible sur http://localhost:3000
```

---

## 4. Migration de la Base de Données Supabase

Le script SQL complet et exécutable se trouve dans `supabase/schema.sql`.

### Étapes d'exécution :
1. Connectez-vous à votre [Tableau de bord Supabase](https://supabase.com/dashboard/project/wdtvesrkbybvihbskond).
2. Cliquez sur l'onglet **SQL Editor** dans le menu latéral gauche.
3. Créez une nouvelle requête (**New Query**).
4. Copiez-collez l'intégralité du contenu du fichier `supabase/schema.sql`.
5. Cliquez sur **Run** (ou `Cmd+Enter` / `Ctrl+Enter`).

Le script va créer :
- Les tables : `profiles`, `services`, `feedback`, `questions`, `settings`.
- Les fonctions de sécurité : `is_active_admin()`, `is_super_admin()`, `can_current_user_reply()`.
- La fonction RPC `mark_question_replied(question_id uuid)` (`SECURITY DEFINER`).
- Les politiques RLS (Row Level Security) protégeant les données.
- Les données initiales de paramétrage et les 5 services de Chef Sébastien.

---

## 5. Création du Premier Super Admin

1. Rendez-vous dans **Authentication > Users** sur votre tableau de bord Supabase.
2. Cliquez sur **Add User** -> **Create User**.
3. Renseignez :
   - Email : `informatiquechefsebastien@gmail.com`
   - Password : Définissez un mot de passe sécurisé.
   - Cochez **Auto Confirm User?** pour valider l'email immédiatement.
4. Récupérez l'**UUID (User UID)** généré pour cet utilisateur.
5. Dans le **SQL Editor**, exécutez la commande suivante en remplaçant `'VOTRE_USER_UUID_ICI'` par l'UID copié :

```sql
INSERT INTO public.profiles (id, full_name, email, role, status, can_reply)
VALUES (
  'VOTRE_USER_UUID_ICI',
  'Chef Sébastien (Direction)',
  'informatiquechefsebastien@gmail.com',
  'super_admin',
  'active',
  true
) ON CONFLICT (id) DO UPDATE 
SET role = 'super_admin', can_reply = true, status = 'active';
```

L'administrateur peut désormais se connecter sur `/admin/login`.

---

## 6. Déploiement de l'Edge Function `create-admin`

L'Edge Function permet au Super Admin d'inviter de nouveaux collaborateurs par email sans stocker ni afficher leurs mots de passe :

```bash
# 1. Connexion au CLI Supabase
supabase login

# 2. Lier le projet distant
supabase link --project-ref wdtvesrkbybvihbskond

# 3. Déployer l'Edge Function
supabase functions deploy create-admin
```

---

## 7. Déploiement sur Vercel

1. Poussez votre code sur votre dépôt GitHub / GitLab.
2. Rendez-vous sur [Vercel](https://vercel.com) et cliquez sur **Add New Project**.
3. Importez le dépôt.
4. Dans **Environment Variables**, ajoutez :
   - `VITE_SUPABASE_URL` = `https://wdtvesrkbybvihbskond.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_kssguoe3gjCjrWrLCjriMg_sVoIIEwn`
5. Cliquez sur **Deploy**.
6. Configuration SPA : Un fichier `vercel.json` est fourni pour rediriger toutes les routes vers `index.html` (support de React Router).

---

## 8. Parcours et Fonctionnalités Implémentées

### Partie Publique (Sans inscription)
- `/` : Accueil mobile-first avec 3 grands boutons adaptés au pouce :
  - ⭐ **Donner mon avis** (`/feedback`)
  - 💬 **Poser une question** (`/question`)
  - 👤 **Parler à un conseiller** (ouvre WhatsApp avec le message de devis/service)
- `/feedback` : Note 1–5 étoiles, choix du service, commentaire obligatoire, nom/téléphone (optionnel ou obligatoire selon paramètres), confettis de succès.
- `/question` : Formulaire ultra-simplifié en 3 champs obligatoires (Nom, Numéro WhatsApp avec préfixe `+509` normalisé et avertissement, question multi-lignes ≤ 1000 caractères, protection honeypot anti-spam).

### Dashboard Admin
- `/admin/login` : Authentification Supabase sécurisée sans inscription publique, récupération mot de passe.
- `/admin/dashboard` : Indicateurs clés (Total avis, moyenne, avis du mois, questions à répondre, alertes 1–2 étoiles ⚠️).
- `/admin/feedback` : Traitement des avis, classification automatique (1–2 = Attention, 3 = Normal, 4–5 = Positif), modification de statut (`pending`, `reviewed`, `resolved`, `archived`), filtres multiples.
- `/admin/questions` : Traitement en 1 clic : ouverture immédiate de WhatsApp avec le message personnalisé prérempli (`Bonjour {prénom}, merci pour votre message.`) et bascule automatique en `RÉPONDUE` via la fonction SQL `mark_question_replied`. Compteurs en direct (Toutes, Reçues, Répondues).
- `/admin/statistics` : Graphiques Recharts (répartition des notes en %, satisfaction globale, volume par service, courbe chronologique).
- `/admin/admins` *(Super Admin)* : Gestion d'équipe, activation/désactivation, attribution de la permission `can_reply`.
- `/admin/settings` *(Super Admin)* : Coordonnées WhatsApp, modèle de réponse avec balise `{prénom}`, gestion des services, option téléphone obligatoire, et **générateur de QR Code téléchargeable en haute qualité (PNG)**.
