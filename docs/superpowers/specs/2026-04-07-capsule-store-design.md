# Capsule Store — Design Spec
**Date :** 2026-04-07
**Stack :** Next.js 14 + Three.js/R3F + Supabase + Stripe
**Déploiement :** Vercel (sur validation utilisateur)

---

## 1. Contexte & Objectif

Site e-commerce de vente de compléments alimentaires en capsules. Esthétique futuriste-corpo inspirée du Nothing Style : minimaliste, calme, aucune couleur extravagante. 5 références au lancement. Bilingue FR / EN. Expérience 3D immersive comme différenciateur central.

---

## 2. Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| 3D | Three.js + React Three Fiber + Drei |
| Base de données | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage (modèles GLB, images) |
| Paiement | Stripe (mode test, carte uniquement) |
| i18n | next-intl (routes `/fr/...` et `/en/...`) |
| Style | Tailwind CSS |
| Déploiement | Vercel |

---

## 3. Structure des pages

### Pages publiques
- `/` — Homepage : hero 3D immersif + section produits vedettes
- `/products` — Grille des 5 capsules
- `/products/[slug]` — Page produit avec viewer 3D interactif + achat
- `/cart` — Panier
- `/checkout` — Formulaire de paiement (Stripe Checkout hosted)
- `/order-success` — Confirmation de commande
- `/about` — Brand story futuriste

### Pages auth & compte
- `/login` — Connexion Supabase Auth
- `/register` — Création de compte
- `/account` — Dashboard utilisateur
- `/account/orders` — Historique des commandes
- `/account/orders/[id]` — Détail d'une commande

Toutes les routes sont préfixées `/fr/` ou `/en/`. La langue par défaut est détectée via l'en-tête `Accept-Language` et sauvegardée en cookie.

---

## 4. Design System

### Palette
| Token | Valeur | Usage |
|---|---|---|
| `void-black` | `#060606` | Background principal |
| `surface` | `#111111` | Cards, panels |
| `elevated` | `#1A1A1A` | Hover states |
| `border` | `#2A2A2A` | Séparateurs, bordures |
| `ice-white` | `#E8E8E8` | Texte principal |
| `muted` | `#666666` | Texte secondaire |
| `metallic` | `linear-gradient(135deg, #C8C8C8, #888)` | CTAs, highlights |

### Typographie
- **Titres / Logo :** Helvetica Neue Light, `letter-spacing: 4–6px`, tout en majuscules
- **Corps :** Helvetica Neue Regular, `letter-spacing: 1–2px`
- **Monospace / Labels / Tags :** Space Mono, `letter-spacing: 2–3px`, tout en majuscules

### Principes UI
- Aucune couleur vive. Tout repose sur les contrastes noir / blanc cassé / gris métallique.
- Boutons : gradient métallique froid pour les CTAs primaires, bordure fine `#2A2A2A` pour les secondaires.
- Inputs : fond `#0D0D0D`, bordure `#2A2A2A`, texte monospace majuscule.
- Tags/badges : fond `#1A1A1A`, bordure fine, texte `#666`.
- Animations : subtiles, `ease-out`, durées 200–400ms. Aucun effet flashy.

---

## 5. Expérience 3D

### Hero — Scène ambiante (homepage)
- Canvas `position: absolute; inset: 0` sur toute la section hero, `background: transparent`, `alpha: true` (Three.js)
- Le modèle GLB flotte dans le void sans conteneur ni bordure — il émerge de la noirceur
- Rotation automatique lente sur l'axe Y
- Particules ambiantes (champ d'étoiles épars, ~200 points)
- Éclairage : `AmbientLight` très faible + `PointLight` froid (6500K) latéral
- Post-processing : bloom très subtil (UnrealBloomPass, strength 0.3)
- Matériau : `MeshPhysicalMaterial`, `roughness: 0.15`, `metalness: 0.9`
- Texte et CTA positionnés par-dessus via `z-index`

### Viewer produit — Interactif
- `OrbitControls` : drag pour tourner, scroll pour zoomer (limites définies)
- Touch events natifs sur mobile
- Fond transparent sur `#060606`
- Chargement progressif via React `Suspense` + `useGLTF`
- Fallback image statique si WebGL non disponible
- Indicateur "GLISSER POUR TOURNER" disparaît après première interaction
- Modèles GLB stockés dans Supabase Storage, URL dans `products.model_3d_url`

---

## 6. Modèle de données (Supabase)

### Table `products`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
slug            text UNIQUE NOT NULL
name_fr         text NOT NULL
name_en         text NOT NULL
description_fr  text
description_en  text
price           numeric(10,2) NOT NULL
stock           integer NOT NULL DEFAULT 0
model_3d_url    text        -- URL Supabase Storage (fichier .glb)
stripe_price_id text        -- ID Stripe Price (mode test)
category        text
active          boolean DEFAULT true
created_at      timestamptz DEFAULT now()
```

### Table `profiles`
```sql
id               uuid REFERENCES auth.users PRIMARY KEY
full_name        text
preferred_lang   text CHECK (preferred_lang IN ('fr', 'en'))
shipping_address jsonb
updated_at       timestamptz DEFAULT now()
```
Créée automatiquement via trigger Supabase à l'inscription.

### Table `orders`
```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id           uuid REFERENCES auth.users NOT NULL
stripe_session_id text UNIQUE NOT NULL
status            text DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','delivered'))
total             numeric(10,2) NOT NULL
created_at        timestamptz DEFAULT now()
```

### Table `order_items`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
order_id    uuid REFERENCES orders NOT NULL
product_id  uuid REFERENCES products NOT NULL
quantity    integer NOT NULL
unit_price  numeric(10,2) NOT NULL
```

### Sécurité RLS
- `products` : lecture publique (`SELECT` pour tous), écriture réservée au rôle `service_role`
- `profiles` : lecture/écriture uniquement par `auth.uid() = id`
- `orders` : lecture/écriture uniquement par `auth.uid() = user_id`
- `order_items` : accès via jointure `orders` (policy sur `order_id`)

---

## 7. Flux paiement

```
PANIER (localStorage)
  → Server Action `createCheckoutAction`
    → Stripe: createCheckoutSession({ line_items, mode: 'payment' })
      → Redirect Stripe Hosted Checkout
        → Webhook POST /api/webhooks/stripe (API Route)
          → Vérification signature Stripe
            → INSERT orders + order_items (via service_role)
            → UPDATE products SET stock = stock - qty (via service_role)
              → Redirect /order-success?session_id=...
```

- Le panier est stocké en `localStorage` (pas en base) — simplifié pour le lancement
- La session Stripe contient les `metadata` : `user_id` et les items sérialisés (product_id, qty, unit_price)
- La route webhook est une API Route Next.js (pas un Server Action) pour accéder au raw body Stripe
- Le stock est décrémenté dans le webhook, pas au moment de l'ajout au panier (évite les faux réservations)

---

## 8. Auth

- Supabase Auth avec email/password
- Pas de OAuth au lancement
- Sessions gérées via `@supabase/ssr` (cookies HTTP-only)
- Middleware Next.js pour protéger `/account/**` et `/checkout`
- Redirect post-login vers la page d'origine

---

## 9. i18n

- `next-intl` avec fichiers de traduction `messages/fr.json` et `messages/en.json`
- Détection automatique via `Accept-Language` au premier chargement
- Switch FR/EN dans la navbar sans rechargement complet
- Les champs produits bilingues (`name_fr`/`name_en`, `description_fr`/`description_en`) sont sélectionnés selon la locale active

---

## 10. Hors périmètre (lancement)

- OAuth (Google, Apple…)
- Abonnements récurrents
- Avis clients / notation
- Dashboard admin
- Notifications email post-commande (ajout ultérieur via Resend/SendGrid)
- PWA / app mobile
