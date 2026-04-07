# Capsule Store — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (FR/EN) e-commerce site selling 5 supplement capsule products with immersive 3D (Three.js), Supabase backend, and Stripe payment (test mode).

**Architecture:** Next.js 14 App Router with locale-prefixed routes (`/fr/...`, `/en/...`). React Three Fiber renders a full-screen ambient hero scene (no borders, model fused with void background) and an interactive per-product OrbitControls viewer. Supabase handles auth + PostgreSQL + RLS. Stripe Checkout (hosted) handles payments; a webhook API Route creates orders post-payment.

**Tech Stack:** Next.js 14, React Three Fiber + @react-three/drei + @react-three/postprocessing, @supabase/ssr, Stripe, next-intl, Tailwind CSS, Zustand, Vitest + @testing-library/react

---

## File Map

```
D:/Claude/Deploy/Capsule/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # Root layout with Navbar/Footer + NextIntlClientProvider
│   │   ├── page.tsx                # Homepage: hero 3D + featured products
│   │   ├── about/page.tsx          # Brand story
│   │   ├── products/
│   │   │   ├── page.tsx            # Products grid
│   │   │   └── [slug]/page.tsx     # Product detail + 3D viewer + add to cart
│   │   ├── cart/page.tsx           # Cart page
│   │   ├── checkout/page.tsx       # Stripe redirect trigger
│   │   ├── order-success/page.tsx  # Post-payment confirmation
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── account/
│   │       ├── page.tsx            # Account dashboard
│   │       ├── orders/page.tsx     # Order history
│   │       └── orders/[id]/page.tsx
│   └── api/
│       └── webhooks/stripe/route.ts  # Stripe webhook → INSERT orders
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Badge.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── three/
│   │   ├── HeroScene.tsx           # Full-screen ambient scene (no container)
│   │   └── ProductViewer.tsx       # OrbitControls interactive viewer
│   ├── products/
│   │   └── ProductCard.tsx
│   └── cart/
│       └── CartDrawer.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server Supabase client (cookies)
│   ├── stripe.ts                   # Stripe singleton
│   └── utils.ts                    # formatPrice, cn()
├── store/
│   └── cart.ts                     # Zustand cart store (localStorage)
├── actions/
│   ├── auth.ts                     # signIn, signUp, signOut Server Actions
│   └── checkout.ts                 # createCheckoutSession Server Action
├── messages/
│   ├── fr.json
│   └── en.json
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
├── middleware.ts                   # next-intl locale detection + Supabase auth refresh
├── i18n.ts                         # next-intl config
├── tailwind.config.ts
├── next.config.ts
├── vitest.config.ts
└── .env.local                      # never committed
```

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `.env.local`, `.env.example`, `.gitignore`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd D:/Claude/Deploy/Capsule
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias="@/*" --no-git
```

Expected: Next.js project created in `D:/Claude/Deploy/Capsule`.

- [ ] **Step 2: Install dependencies**

```bash
npm install \
  @supabase/ssr @supabase/supabase-js \
  stripe \
  next-intl \
  zustand \
  three @react-three/fiber @react-three/drei @react-three/postprocessing \
  @types/three
```

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure `next.config.ts`**

```typescript
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default withNextIntl(nextConfig)
```

- [ ] **Step 4: Configure `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 5: Create `vitest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Create `.env.example`**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (test keys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 7: Copy `.env.example` to `.env.local` et remplir les vraies valeurs**

- [ ] **Step 8: Create `.gitignore` entry**

Add to `.gitignore`:
```
.env.local
.superpowers/
```

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "feat: initial Next.js project setup with dependencies"
```

---

## Task 2: Supabase Schema

**Files:**
- Create: `supabase/migrations/001_initial.sql`

- [ ] **Step 1: Create `supabase/migrations/001_initial.sql`**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products
CREATE TABLE products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  name_fr         text NOT NULL,
  name_en         text NOT NULL,
  description_fr  text,
  description_en  text,
  price           numeric(10,2) NOT NULL,
  stock           integer NOT NULL DEFAULT 0,
  model_3d_url    text,
  stripe_price_id text,
  category        text,
  active          boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id               uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name        text,
  preferred_lang   text CHECK (preferred_lang IN ('fr', 'en')),
  shipping_address jsonb,
  updated_at       timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users NOT NULL,
  stripe_session_id text UNIQUE NOT NULL,
  status            text DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','shipped','delivered')),
  total             numeric(10,2) NOT NULL,
  created_at        timestamptz DEFAULT now()
);

-- Order items
CREATE TABLE order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid REFERENCES orders ON DELETE CASCADE NOT NULL,
  product_id  uuid REFERENCES products NOT NULL,
  quantity    integer NOT NULL CHECK (quantity > 0),
  unit_price  numeric(10,2) NOT NULL
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- products: public read
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (active = true);

-- profiles: own only
CREATE POLICY "profiles_own_read" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- orders: own only
CREATE POLICY "orders_own_read" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- order_items: via order ownership
CREATE POLICY "order_items_own_read" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Fonction RPC pour décrémenter le stock de façon atomique
CREATE OR REPLACE FUNCTION decrement_stock(product_id uuid, qty integer)
RETURNS void AS $$
  UPDATE products SET stock = GREATEST(0, stock - qty) WHERE id = product_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Seed products
INSERT INTO products (slug, name_fr, name_en, description_fr, description_en, price, stock, category) VALUES
('energie-pure',   'Énergie Pure',    'Pure Energy',      'Complexe vitamines B, CoQ10 et guarana standardisé pour une énergie durable sans crash.', 'B-vitamin complex, CoQ10 and standardized guarana for sustained energy without crash.', 49.00, 100, 'energy'),
('focus-cognitif', 'Focus Cognitif',  'Cognitive Focus',  'Lion''s mane, bacopa monnieri et L-théanine pour la clarté mentale et la concentration.', 'Lion''s mane, bacopa monnieri and L-theanine for mental clarity and focus.',             54.00, 80,  'cognitive'),
('sommeil-profond','Sommeil Profond', 'Deep Sleep',       'Mélatonine micro-dosée, magnésium bisglycinate et ashwagandha pour un sommeil réparateur.', 'Micro-dosed melatonin, magnesium bisglycinate and ashwagandha for restorative sleep.',  44.00, 120, 'recovery'),
('immunite-core',  'Immunité Core',   'Core Immunity',    'Vitamine D3+K2, zinc, sélénium et extrait d''acérola pour un système immunitaire optimal.', 'Vitamin D3+K2, zinc, selenium and acerola extract for optimal immune function.',       39.00, 150, 'immunity'),
('recuperation',   'Récupération',    'Recovery',         'BCAA fermentés, glutamine et curcuma haute biodisponibilité pour la régénération musculaire.', 'Fermented BCAAs, glutamine and high-bioavailability turmeric for muscle regeneration.', 52.00, 90,  'recovery');
```

- [ ] **Step 2: Appliquer la migration via Supabase Dashboard ou CLI**

Option A — Dashboard : SQL Editor → coller le contenu → Run.
Option B — CLI (si installé) :
```bash
supabase db push
```

- [ ] **Step 3: Créer le bucket Storage**

Dans Supabase Dashboard → Storage → New bucket : `models` (public).

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: Supabase schema, RLS policies, seed products"
```

---

## Task 3: Design System (Tailwind)

**Files:**
- Modify: `tailwind.config.ts`
- Create: `app/globals.css`

- [ ] **Step 1: Mettre à jour `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        void:     '#060606',
        surface:  '#111111',
        elevated: '#1A1A1A',
        border:   '#2A2A2A',
        ice:      '#E8E8E8',
        muted:    '#666666',
      },
      fontFamily: {
        sans:  ['var(--font-helvetica)', 'Helvetica Neue', 'sans-serif'],
        mono:  ['var(--font-space-mono)', 'Space Mono', 'monospace'],
      },
      letterSpacing: {
        widest2: '0.25em',
        widest3: '0.35em',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Mettre à jour `app/globals.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-space-mono: 'Space Mono', monospace;
}

* {
  box-sizing: border-box;
}

html {
  background-color: #060606;
  color: #E8E8E8;
  -webkit-font-smoothing: antialiased;
}

body {
  background-color: #060606;
}

/* Scrollbar minimal */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #060606; }
::-webkit-scrollbar-thumb { background: #2A2A2A; }

/* Selection */
::selection { background: #2A2A2A; color: #E8E8E8; }
```

- [ ] **Step 3: Créer `lib/utils.ts`**

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, locale: string = 'fr'): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}
```

- [ ] **Step 4: Installer clsx et tailwind-merge**

```bash
npm install clsx tailwind-merge
```

- [ ] **Step 5: Tests `lib/utils.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { formatPrice, cn } from '@/lib/utils'

describe('formatPrice', () => {
  it('formats EUR in French locale', () => {
    const result = formatPrice(49, 'fr')
    expect(result).toContain('49')
    expect(result).toContain('€')
  })

  it('formats EUR in English locale', () => {
    const result = formatPrice(49, 'en')
    expect(result).toContain('49')
    expect(result).toContain('€')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('resolves Tailwind conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run lib/utils.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 7: Créer les composants UI de base**

`components/ui/Button.tsx`:
```typescript
import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'font-mono text-[10px] tracking-[0.25em] uppercase transition-opacity duration-200 disabled:opacity-40',
          variant === 'primary' && [
            'bg-gradient-to-br from-[#C8C8C8] to-[#888888]',
            'text-void px-6 py-3 font-bold',
            'hover:opacity-90',
          ],
          variant === 'ghost' && [
            'border border-border text-ice px-6 py-3',
            'hover:border-muted',
          ],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
```

`components/ui/Input.tsx`:
```typescript
import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full bg-[#0D0D0D] border border-border text-ice',
        'font-mono text-xs tracking-widest uppercase placeholder:text-[#333]',
        'px-4 py-3 outline-none focus:border-muted transition-colors duration-200',
        className,
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
export default Input
```

`components/ui/Badge.tsx`:
```typescript
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  active?: boolean
}

export default function Badge({ children, className, active }: BadgeProps) {
  return (
    <span
      className={cn(
        'font-mono text-[9px] tracking-[0.25em] uppercase px-2 py-1',
        'bg-elevated border border-border text-muted',
        active && 'border-ice text-ice',
        className,
      )}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: design system — Tailwind config, utils, UI components"
```

---

## Task 4: i18n Setup

**Files:**
- Create: `i18n.ts`, `middleware.ts`, `messages/fr.json`, `messages/en.json`
- Create: `app/[locale]/layout.tsx`

- [ ] **Step 1: Créer `i18n.ts`**

```typescript
import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

const locales = ['fr', 'en'] as const
export type Locale = (typeof locales)[number]

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound()
  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
```

- [ ] **Step 2: Créer `messages/fr.json`**

```json
{
  "nav": {
    "products": "PRODUITS",
    "about": "À PROPOS",
    "login": "CONNEXION",
    "account": "MON COMPTE",
    "cart": "PANIER"
  },
  "home": {
    "tagline": "FORMULE AVANCÉE",
    "headline": "OPTIMISE\nTON\nPOTENTIEL",
    "sub": "Compléments de précision.\nFormulés pour la performance.",
    "cta": "DÉCOUVRIR →",
    "featured": "FORMULES SÉLECTIONNÉES"
  },
  "products": {
    "title": "NOS FORMULES",
    "subtitle": "5 RÉFÉRENCES · QUALITÉ PHARMACEUTIQUE",
    "addToCart": "AJOUTER AU PANIER",
    "learnMore": "COMPOSITION COMPLÈTE",
    "inStock": "EN STOCK",
    "outOfStock": "RUPTURE",
    "rotate": "GLISSER POUR TOURNER",
    "capsules": "CAPSULES",
    "days": "JOURS"
  },
  "cart": {
    "title": "PANIER",
    "empty": "PANIER VIDE",
    "total": "TOTAL",
    "checkout": "PROCÉDER AU PAIEMENT",
    "remove": "SUPPRIMER",
    "quantity": "QTÉ"
  },
  "auth": {
    "email": "EMAIL",
    "password": "MOT DE PASSE",
    "fullName": "NOM COMPLET",
    "login": "SE CONNECTER",
    "register": "CRÉER UN COMPTE",
    "noAccount": "PAS DE COMPTE ?",
    "hasAccount": "DÉJÀ UN COMPTE ?"
  },
  "account": {
    "title": "MON COMPTE",
    "orders": "COMMANDES",
    "noOrders": "AUCUNE COMMANDE",
    "orderNumber": "COMMANDE",
    "status": {
      "pending": "EN ATTENTE",
      "paid": "PAYÉE",
      "shipped": "EXPÉDIÉE",
      "delivered": "LIVRÉE"
    }
  },
  "success": {
    "title": "COMMANDE CONFIRMÉE",
    "subtitle": "Merci. Votre commande a été reçue.",
    "cta": "VOIR MES COMMANDES"
  },
  "about": {
    "title": "NOTRE MISSION",
    "body": "Capsule est né d'une conviction : la nutrition de précision ne devrait pas ressembler à une pharmacie. Nous formulons chaque complexe avec des actifs cliniquement dosés, dans un conditionnement qui respecte votre espace.",
    "values": ["PRÉCISION", "PURETÉ", "MINIMALISME"]
  }
}
```

- [ ] **Step 3: Créer `messages/en.json`**

```json
{
  "nav": {
    "products": "PRODUCTS",
    "about": "ABOUT",
    "login": "LOGIN",
    "account": "MY ACCOUNT",
    "cart": "CART"
  },
  "home": {
    "tagline": "ADVANCED FORMULA",
    "headline": "OPTIMISE\nYOUR\nPOTENTIAL",
    "sub": "Precision supplements.\nFormulated for performance.",
    "cta": "DISCOVER →",
    "featured": "SELECTED FORMULAS"
  },
  "products": {
    "title": "OUR FORMULAS",
    "subtitle": "5 REFERENCES · PHARMACEUTICAL GRADE",
    "addToCart": "ADD TO CART",
    "learnMore": "FULL COMPOSITION",
    "inStock": "IN STOCK",
    "outOfStock": "OUT OF STOCK",
    "rotate": "DRAG TO ROTATE",
    "capsules": "CAPSULES",
    "days": "DAYS"
  },
  "cart": {
    "title": "CART",
    "empty": "EMPTY CART",
    "total": "TOTAL",
    "checkout": "PROCEED TO CHECKOUT",
    "remove": "REMOVE",
    "quantity": "QTY"
  },
  "auth": {
    "email": "EMAIL",
    "password": "PASSWORD",
    "fullName": "FULL NAME",
    "login": "SIGN IN",
    "register": "CREATE ACCOUNT",
    "noAccount": "NO ACCOUNT?",
    "hasAccount": "ALREADY HAVE AN ACCOUNT?"
  },
  "account": {
    "title": "MY ACCOUNT",
    "orders": "ORDERS",
    "noOrders": "NO ORDERS YET",
    "orderNumber": "ORDER",
    "status": {
      "pending": "PENDING",
      "paid": "PAID",
      "shipped": "SHIPPED",
      "delivered": "DELIVERED"
    }
  },
  "success": {
    "title": "ORDER CONFIRMED",
    "subtitle": "Thank you. Your order has been received.",
    "cta": "VIEW MY ORDERS"
  },
  "about": {
    "title": "OUR MISSION",
    "body": "Capsule was born from a conviction: precision nutrition should not look like a pharmacy. We formulate each complex with clinically dosed actives, in packaging that respects your space.",
    "values": ["PRECISION", "PURITY", "MINIMALISM"]
  }
}
```

- [ ] **Step 4: Créer `middleware.ts`**

```typescript
import createMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const intlMiddleware = createMiddleware({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localeDetection: true,
})

const protectedRoutes = ['/account', '/checkout']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = protectedRoutes.some(r =>
    pathname.includes(r)
  )

  // Refresh Supabase session
  let response = intlMiddleware(request)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (isProtected && !user) {
    const locale = pathname.split('/')[1] || 'fr'
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 5: Déplacer `app/layout.tsx` et créer `app/[locale]/layout.tsx`**

Supprimer `app/layout.tsx` généré par create-next-app.

Créer `app/[locale]/layout.tsx`:
```typescript
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import '@/app/globals.css'

const locales = ['fr', 'en']

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale)) notFound()

  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className="bg-void text-ice min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: i18n setup with next-intl, FR/EN messages, middleware"
```

---

## Task 5: Supabase Client + Auth Actions

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `actions/auth.ts`

- [ ] **Step 1: Créer `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Créer `lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function createServiceClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
}
```

- [ ] **Step 3: Créer `actions/auth.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData, locale: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect(`/${locale}/account`)
}

export async function signUp(formData: FormData, locale: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: { full_name: formData.get('fullName') as string },
    },
  })
  if (error) return { error: error.message }
  redirect(`/${locale}/account`)
}

export async function signOut(locale: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/${locale}/login`)
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Supabase client setup and auth Server Actions"
```

---

## Task 6: Navbar + Footer

**Files:**
- Create: `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`

- [ ] **Step 1: Créer `components/layout/Navbar.tsx`**

```typescript
'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'

export default function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const itemCount = useCartStore(s => s.items.reduce((acc, i) => acc + i.quantity, 0))

  function switchLocale() {
    const next = locale === 'fr' ? 'en' : 'fr'
    const segments = pathname.split('/')
    segments[1] = next
    router.push(segments.join('/'))
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 border-b border-border/50 bg-void/80 backdrop-blur-sm">
      <Link href={`/${locale}`} className="font-mono text-[11px] tracking-[0.5em] text-ice hover:text-muted transition-colors">
        CAPSULE
      </Link>

      <div className="hidden md:flex items-center gap-8">
        <Link href={`/${locale}/products`} className="font-mono text-[9px] tracking-[0.25em] text-muted hover:text-ice transition-colors">
          {t('products')}
        </Link>
        <Link href={`/${locale}/about`} className="font-mono text-[9px] tracking-[0.25em] text-muted hover:text-ice transition-colors">
          {t('about')}
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={switchLocale}
          className="font-mono text-[9px] tracking-[0.2em] text-muted hover:text-ice transition-colors"
        >
          {locale === 'fr' ? 'FR · EN' : 'EN · FR'}
        </button>
        <Link href={`/${locale}/account`} className="font-mono text-[9px] tracking-[0.25em] text-muted hover:text-ice transition-colors">
          ○
        </Link>
        <Link href={`/${locale}/cart`} className="font-mono text-[9px] tracking-[0.25em] text-muted hover:text-ice transition-colors relative">
          ⊙{itemCount > 0 && (
            <span className="absolute -top-2 -right-2 text-[8px] text-ice font-mono">{itemCount}</span>
          )}
        </Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Créer `components/layout/Footer.tsx`**

```typescript
import { useTranslations } from 'next-intl'

export default function Footer() {
  return (
    <footer className="border-t border-border px-8 py-8 mt-auto">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.5em] text-muted">CAPSULE</span>
        <span className="font-mono text-[8px] tracking-[0.2em] text-[#333]">
          © {new Date().getFullYear()} · TOUS DROITS RÉSERVÉS
        </span>
        <span className="font-mono text-[8px] tracking-[0.2em] text-[#333]">
          PRECISION NUTRITION
        </span>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: Navbar and Footer layout components"
```

---

## Task 7: Cart Store (Zustand)

**Files:**
- Create: `store/cart.ts`
- Create: `store/cart.test.ts`

- [ ] **Step 1: Écrire le test `store/cart.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '@/store/cart'

// Reset store between tests
beforeEach(() => {
  useCartStore.setState({ items: [] })
})

describe('cart store', () => {
  it('adds an item', () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Énergie', price: 49, quantity: 1, slug: 'energie-pure' })
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].quantity).toBe(1)
  })

  it('increments quantity when same item added', () => {
    const item = { id: 'p1', name: 'Énergie', price: 49, quantity: 1, slug: 'energie-pure' }
    useCartStore.getState().addItem(item)
    useCartStore.getState().addItem(item)
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })

  it('removes an item', () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Énergie', price: 49, quantity: 1, slug: 'energie-pure' })
    useCartStore.getState().removeItem('p1')
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('clears the cart', () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Énergie', price: 49, quantity: 1, slug: 'energie-pure' })
    useCartStore.getState().addItem({ id: 'p2', name: 'Focus', price: 54, quantity: 1, slug: 'focus-cognitif' })
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('computes total correctly', () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Énergie', price: 49, quantity: 2, slug: 'energie-pure' })
    useCartStore.getState().addItem({ id: 'p2', name: 'Focus', price: 54, quantity: 1, slug: 'focus-cognitif' })
    expect(useCartStore.getState().total()).toBe(152)
  })
})
```

- [ ] **Step 2: Run test — vérifier qu'il échoue**

```bash
npx vitest run store/cart.test.ts
```

Expected: FAIL — "useCartStore is not defined"

- [ ] **Step 3: Créer `store/cart.ts`**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  slug: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.id === item.id)
        if (existing) {
          return {
            items: state.items.map(i =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          }
        }
        return { items: [...state.items, item] }
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id),
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        items: quantity <= 0
          ? state.items.filter(i => i.id !== id)
          : state.items.map(i => i.id === id ? { ...i, quantity } : i),
      })),

      clearCart: () => set({ items: [] }),

      total: () => get().items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    }),
    { name: 'capsule-cart' }
  )
)
```

- [ ] **Step 4: Run test — vérifier qu'il passe**

```bash
npx vitest run store/cart.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Zustand cart store with localStorage persistence"
```

---

## Task 8: Pages Auth (Login + Register)

**Files:**
- Create: `app/[locale]/login/page.tsx`, `app/[locale]/register/page.tsx`

- [ ] **Step 1: Créer `app/[locale]/login/page.tsx`**

```typescript
'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import { signIn } from '@/actions/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await signIn(new FormData(e.currentTarget), locale)
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="font-mono text-[9px] tracking-[0.4em] text-muted mb-8">
          CAPSULE · {t('login')}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input name="email" type="email" placeholder={t('email')} required />
          <Input name="password" type="password" placeholder={t('password')} required />

          {error && (
            <p className="font-mono text-[9px] tracking-widest text-red-400/70">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="mt-2 w-full justify-center">
            {loading ? '...' : t('login')}
          </Button>
        </form>

        <p className="font-mono text-[9px] tracking-[0.2em] text-muted mt-6">
          {t('noAccount')}{' '}
          <Link href={`/${locale}/register`} className="text-ice hover:text-muted transition-colors">
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Créer `app/[locale]/register/page.tsx`**

```typescript
'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import { signUp } from '@/actions/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await signUp(new FormData(e.currentTarget), locale)
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="font-mono text-[9px] tracking-[0.4em] text-muted mb-8">
          CAPSULE · {t('register')}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input name="fullName" type="text" placeholder={t('fullName')} required />
          <Input name="email" type="email" placeholder={t('email')} required />
          <Input name="password" type="password" placeholder={t('password')} minLength={8} required />

          {error && (
            <p className="font-mono text-[9px] tracking-widest text-red-400/70">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="mt-2 w-full justify-center">
            {loading ? '...' : t('register')}
          </Button>
        </form>

        <p className="font-mono text-[9px] tracking-[0.2em] text-muted mt-6">
          {t('hasAccount')}{' '}
          <Link href={`/${locale}/login`} className="text-ice hover:text-muted transition-colors">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Test manuel**

```bash
npm run dev
```

Ouvrir http://localhost:3000/fr/register → créer un compte → redirect vers /fr/account.
Ouvrir http://localhost:3000/fr/login → se connecter → redirect vers /fr/account.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: login and register pages with Supabase auth"
```

---

## Task 9: Hero Scene 3D (Homepage)

**Files:**
- Create: `components/three/HeroScene.tsx`
- Create: `app/[locale]/page.tsx`

- [ ] **Step 1: Créer `components/three/HeroScene.tsx`**

```typescript
'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

function CapsuleModel() {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame(({ clock }) => {
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.3
    groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.05
  })

  return (
    <group ref={groupRef}>
      {/* Corps principal */}
      <mesh>
        <capsuleGeometry args={[0.28, 0.6, 8, 32]} />
        <meshPhysicalMaterial
          color="#1A1A1A"
          roughness={0.15}
          metalness={0.9}
          reflectivity={1}
          envMapIntensity={0.8}
        />
      </mesh>
      {/* Bande centrale */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.285, 0.285, 0.08, 32]} />
        <meshPhysicalMaterial
          color="#2A2A2A"
          roughness={0.05}
          metalness={1}
        />
      </mesh>
      {/* Label gravé */}
      <mesh position={[0, -0.15, 0.29]}>
        <planeGeometry args={[0.28, 0.08]} />
        <meshStandardMaterial color="#111" opacity={0.6} transparent />
      </mesh>
    </group>
  )
}

function Particles({ count = 200 }: { count?: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 10
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return arr
  }, [count])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#2A2A2A" sizeAttenuation />
    </points>
  )
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.03} />
        <pointLight position={[2, 2, 2]} intensity={2} color="#C0D0FF" />
        <pointLight position={[-2, -1, -2]} intensity={0.5} color="#8090CC" />

        <CapsuleModel />
        <Particles />

        <EffectComposer>
          <Bloom luminanceThreshold={0.6} intensity={0.3} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
```

- [ ] **Step 2: Créer `app/[locale]/page.tsx`**

```typescript
import { useTranslations } from 'next-intl'
import { getLocale } from 'next-intl/server'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/products/ProductCard'
import Button from '@/components/ui/Button'

const HeroScene = dynamic(() => import('@/components/three/HeroScene'), { ssr: false })

export default async function HomePage() {
  const t = useTranslations('home')
  const locale = await getLocale()
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .limit(3)

  return (
    <>
      {/* Hero */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <HeroScene />

        <div className="relative z-10 px-8 md:px-16 max-w-lg">
          <p className="font-mono text-[9px] tracking-[0.4em] text-muted mb-6">
            {t('tagline')}
          </p>
          <h1 className="font-sans text-5xl md:text-7xl font-light tracking-[0.1em] text-ice leading-tight whitespace-pre-line">
            {t('headline')}
          </h1>
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted mt-8 leading-relaxed whitespace-pre-line">
            {t('sub')}
          </p>
          <Link href={`/${locale}/products`} className="inline-block mt-10">
            <Button>{t('cta')}</Button>
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-8 bg-gradient-to-b from-border to-transparent" />
          <span className="font-mono text-[7px] tracking-[0.3em] text-[#333]">SCROLL</span>
        </div>
      </section>

      {/* Featured products */}
      {products && products.length > 0 && (
        <section className="px-8 md:px-16 py-24">
          <p className="font-mono text-[9px] tracking-[0.4em] text-muted mb-12">
            {t('featured')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {products.map(product => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
```

- [ ] **Step 3: Test manuel**

```bash
npm run dev
```

Ouvrir http://localhost:3000/fr → la scène 3D doit apparaître, le flacon tourne dans le void sans bordure.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: homepage with full-screen Three.js hero scene"
```

---

## Task 10: Composant ProductCard + Page Products

**Files:**
- Create: `components/products/ProductCard.tsx`
- Create: `app/[locale]/products/page.tsx`

- [ ] **Step 1: Créer `components/products/ProductCard.tsx`**

```typescript
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Badge from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'

interface Product {
  id: string
  slug: string
  name_fr: string
  name_en: string
  description_fr: string | null
  description_en: string | null
  price: number
  stock: number
  category: string | null
}

interface ProductCardProps {
  product: Product
  locale: string
}

export default function ProductCard({ product, locale }: ProductCardProps) {
  const t = useTranslations('products')
  const name = locale === 'fr' ? product.name_fr : product.name_en
  const description = locale === 'fr' ? product.description_fr : product.description_en
  const inStock = product.stock > 0

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="group block bg-void p-8 hover:bg-surface transition-colors duration-300"
    >
      {/* Mini capsule visuelle */}
      <div className="flex justify-center mb-10">
        <div className="w-10 h-16 rounded-full bg-gradient-to-b from-elevated to-surface border border-border group-hover:border-muted transition-colors duration-300" />
      </div>

      <div className="space-y-3">
        {product.category && (
          <Badge>{product.category.toUpperCase()}</Badge>
        )}
        <h3 className="font-sans text-lg font-light tracking-[0.15em] text-ice mt-2">
          {name.toUpperCase()}
        </h3>
        {description && (
          <p className="font-mono text-[10px] tracking-[0.1em] text-muted leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex items-center justify-between pt-4">
          <span className="font-mono text-sm tracking-widest text-ice">
            {formatPrice(product.price, locale)}
          </span>
          <Badge active={inStock}>
            {inStock ? t('inStock') : t('outOfStock')}
          </Badge>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Créer `app/[locale]/products/page.tsx`**

```typescript
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/products/ProductCard'

export default async function ProductsPage() {
  const locale = await getLocale()
  const t = await getTranslations('products')
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })

  return (
    <div className="pt-24 pb-16">
      <div className="px-8 md:px-16 mb-16">
        <p className="font-mono text-[9px] tracking-[0.4em] text-muted mb-3">
          {t('subtitle')}
        </p>
        <h1 className="font-sans text-4xl font-light tracking-[0.2em] text-ice">
          {t('title')}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border mx-8 md:mx-16">
        {products?.map(product => (
          <ProductCard key={product.id} product={product} locale={locale} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: ProductCard component and products listing page"
```

---

## Task 11: Page Produit + Viewer 3D Interactif

**Files:**
- Create: `components/three/ProductViewer.tsx`
- Create: `app/[locale]/products/[slug]/page.tsx`

- [ ] **Step 1: Créer `components/three/ProductViewer.tsx`**

```typescript
'use client'

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'

function CapsuleProduct({ category }: { category: string | null }) {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.03
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <capsuleGeometry args={[0.35, 0.75, 8, 32]} />
        <meshPhysicalMaterial
          color="#1A1A1A"
          roughness={0.1}
          metalness={0.95}
          reflectivity={1}
          clearcoat={0.5}
          clearcoatRoughness={0.1}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.355, 0.355, 0.1, 32]} />
        <meshPhysicalMaterial color="#2A2A2A" roughness={0.02} metalness={1} />
      </mesh>
    </group>
  )
}

interface ProductViewerProps {
  category: string | null
  rotateLabel: string
}

export default function ProductViewer({ category, rotateLabel }: ProductViewerProps) {
  const [interacted, setInteracted] = useState(false)

  return (
    <div className="relative w-full h-full" onPointerDown={() => setInteracted(true)}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.05} />
        <pointLight position={[3, 3, 3]} intensity={3} color="#C0D0FF" />
        <pointLight position={[-3, -2, -3]} intensity={0.8} color="#8090CC" />
        <spotLight position={[0, 5, 0]} intensity={1} color="#FFFFFF" angle={0.3} />

        <CapsuleProduct category={category} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(2 * Math.PI) / 3}
          autoRotate={!interacted}
          autoRotateSpeed={1.5}
        />
      </Canvas>

      {!interacted && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[8px] tracking-[0.3em] text-muted pointer-events-none">
          {rotateLabel}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Créer `app/[locale]/products/[slug]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import AddToCartButton from '@/components/products/AddToCartButton'

const ProductViewer = dynamic(() => import('@/components/three/ProductViewer'), { ssr: false })

interface Props {
  params: { slug: string; locale: string }
}

export default async function ProductPage({ params }: Props) {
  const locale = await getLocale()
  const t = await getTranslations('products')
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', params.slug)
    .eq('active', true)
    .single()

  if (!product) notFound()

  const name = locale === 'fr' ? product.name_fr : product.name_en
  const description = locale === 'fr' ? product.description_fr : product.description_en

  return (
    <div className="min-h-screen pt-20 grid grid-cols-1 lg:grid-cols-2">
      {/* Viewer 3D */}
      <div className="relative h-[60vh] lg:h-screen lg:sticky lg:top-0 bg-void">
        <ProductViewer category={product.category} rotateLabel={t('rotate')} />
      </div>

      {/* Infos produit */}
      <div className="flex flex-col justify-center px-8 md:px-16 py-16">
        <div className="font-mono text-[8px] tracking-[0.4em] text-muted mb-2">
          {product.category?.toUpperCase()}
        </div>

        <h1 className="font-sans text-4xl font-light tracking-[0.15em] text-ice mb-6">
          {name.toUpperCase()}
        </h1>

        <div className="flex gap-2 mb-8">
          <Badge>60 {t('capsules')}</Badge>
          <Badge>30 {t('days')}</Badge>
          <Badge active={product.stock > 0}>
            {product.stock > 0 ? t('inStock') : t('outOfStock')}
          </Badge>
        </div>

        <p className="font-mono text-[11px] tracking-[0.1em] text-muted leading-relaxed mb-10 max-w-sm">
          {description}
        </p>

        <div className="font-mono text-2xl tracking-widest text-ice mb-8">
          {formatPrice(product.price, locale)}
        </div>

        <div className="flex flex-col gap-3 max-w-xs">
          <AddToCartButton product={product} locale={locale} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Créer `components/products/AddToCartButton.tsx`**

```typescript
'use client'

import { useTranslations } from 'next-intl'
import { useCartStore } from '@/store/cart'
import Button from '@/components/ui/Button'

interface Props {
  product: {
    id: string
    slug: string
    name_fr: string
    name_en: string
    price: number
    stock: number
  }
  locale: string
}

export default function AddToCartButton({ product, locale }: Props) {
  const t = useTranslations('products')
  const addItem = useCartStore(s => s.addItem)

  function handleAdd() {
    addItem({
      id: product.id,
      slug: product.slug,
      name: locale === 'fr' ? product.name_fr : product.name_en,
      price: product.price,
      quantity: 1,
    })
  }

  return (
    <Button
      onClick={handleAdd}
      disabled={product.stock === 0}
      className="w-full justify-center"
    >
      {t('addToCart')}
    </Button>
  )
}
```

- [ ] **Step 4: Test manuel**

Ouvrir http://localhost:3000/fr/products/energie-pure → viewer 3D interactif s'affiche, drag pour tourner, bouton "Ajouter au panier" incrémente le badge dans la navbar.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: product detail page with interactive 3D viewer and cart integration"
```

---

## Task 12: Page Panier

**Files:**
- Create: `app/[locale]/cart/page.tsx`

- [ ] **Step 1: Créer `app/[locale]/cart/page.tsx`**

```typescript
'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'

export default function CartPage() {
  const t = useTranslations('cart')
  const locale = useLocale()
  const { items, removeItem, updateQuantity, total } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <p className="font-mono text-[9px] tracking-[0.4em] text-muted">{t('empty')}</p>
        <Link href={`/${locale}/products`}>
          <Button variant="ghost">← PRODUITS</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 px-8 md:px-16 pb-16">
      <p className="font-mono text-[9px] tracking-[0.4em] text-muted mb-12">{t('title')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Items */}
        <div className="lg:col-span-2 space-y-px">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-surface p-6 border-b border-border">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-ice">{item.name.toUpperCase()}</p>
                <p className="font-mono text-[9px] tracking-[0.1em] text-muted mt-1">
                  {formatPrice(item.price, locale)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="font-mono text-muted hover:text-ice w-6 h-6 flex items-center justify-center border border-border"
                  >
                    −
                  </button>
                  <span className="font-mono text-[10px] tracking-widest text-ice w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="font-mono text-muted hover:text-ice w-6 h-6 flex items-center justify-center border border-border"
                  >
                    +
                  </button>
                </div>
                <span className="font-mono text-[10px] tracking-widest text-ice w-16 text-right">
                  {formatPrice(item.price * item.quantity, locale)}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="font-mono text-[8px] tracking-widest text-muted hover:text-ice transition-colors ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="border border-border p-6 space-y-6">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[9px] tracking-[0.3em] text-muted">{t('total')}</span>
              <span className="font-mono text-lg tracking-widest text-ice">
                {formatPrice(total(), locale)}
              </span>
            </div>
            <Link href={`/${locale}/checkout`}>
              <Button className="w-full justify-center">{t('checkout')}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: cart page with quantity controls and order summary"
```

---

## Task 13: Checkout + Stripe

**Files:**
- Create: `lib/stripe.ts`, `actions/checkout.ts`, `app/[locale]/checkout/page.tsx`, `app/[locale]/order-success/page.tsx`

- [ ] **Step 1: Créer `lib/stripe.ts`**

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})
```

- [ ] **Step 2: Créer `actions/checkout.ts`**

```typescript
'use server'

import { redirect } from 'next/navigation'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  slug: string
}

export async function createCheckoutSession(items: CartItem[], locale: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: items.map(item => ({
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(item.price * 100),
        product_data: { name: item.name },
      },
      quantity: item.quantity,
    })),
    metadata: {
      user_id: user.id,
      items: JSON.stringify(items.map(i => ({
        id: i.id,
        quantity: i.quantity,
        unit_price: i.price,
      }))),
    },
    success_url: `${baseUrl}/${locale}/order-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/${locale}/cart`,
  })

  redirect(session.url!)
}
```

- [ ] **Step 3: Créer `app/[locale]/checkout/page.tsx`**

```typescript
'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { createCheckoutSession } from '@/actions/checkout'
import Button from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'

export default function CheckoutPage() {
  const t = useTranslations('cart')
  const locale = useLocale()
  const { items, total } = useCartStore()
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    await createCheckoutSession(items, locale)
  }

  return (
    <div className="min-h-screen pt-28 px-8 md:px-16 pb-16">
      <p className="font-mono text-[9px] tracking-[0.4em] text-muted mb-12">RÉCAPITULATIF</p>

      <div className="max-w-md space-y-px mb-12">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center py-4 border-b border-border">
            <span className="font-mono text-[10px] tracking-[0.2em] text-ice">
              {item.name.toUpperCase()} × {item.quantity}
            </span>
            <span className="font-mono text-[10px] tracking-widest text-muted">
              {formatPrice(item.price * item.quantity, locale)}
            </span>
          </div>
        ))}
        <div className="flex justify-between items-center py-4">
          <span className="font-mono text-[9px] tracking-[0.3em] text-muted">{t('total')}</span>
          <span className="font-mono text-lg tracking-widest text-ice">{formatPrice(total(), locale)}</span>
        </div>
      </div>

      <Button onClick={handleCheckout} disabled={loading || items.length === 0}>
        {loading ? '...' : `PAYER ${formatPrice(total(), locale)} →`}
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Créer `app/[locale]/order-success/page.tsx`**

```typescript
import { useTranslations } from 'next-intl'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import ClearCartOnMount from '@/components/cart/ClearCartOnMount'

export default async function OrderSuccessPage() {
  const t = useTranslations('success')
  const locale = await getLocale()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <ClearCartOnMount />
      <div className="w-8 h-8 border border-ice rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-ice rounded-full" />
      </div>
      <p className="font-mono text-[9px] tracking-[0.5em] text-muted">{t('title')}</p>
      <p className="font-mono text-[10px] tracking-[0.2em] text-ice">{t('subtitle')}</p>
      <Link href={`/${locale}/account/orders`}>
        <Button variant="ghost">{t('cta')}</Button>
      </Link>
    </div>
  )
}
```

- [ ] **Step 5: Créer `components/cart/ClearCartOnMount.tsx`**

```typescript
'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/store/cart'

export default function ClearCartOnMount() {
  const clearCart = useCartStore(s => s.clearCart)
  useEffect(() => { clearCart() }, [clearCart])
  return null
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Stripe checkout session, checkout page, order success"
```

---

## Task 14: Webhook Stripe

**Files:**
- Create: `app/api/webhooks/stripe/route.ts`
- Create: `app/api/webhooks/stripe/route.test.ts`

- [ ] **Step 1: Écrire le test `app/api/webhooks/stripe/route.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Stripe
vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}))

// Mock Supabase service client
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn((table: string) => ({
  insert: mockInsert,
  update: mockUpdate,
  eq: vi.fn().mockReturnThis(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn().mockResolvedValue({
    from: mockFrom,
  }),
}))

describe('Stripe webhook handler', () => {
  it('ignores non-checkout.session.completed events', async () => {
    const { stripe } = await import('@/lib/stripe')
    ;(stripe.webhooks.constructEvent as ReturnType<typeof vi.fn>).mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: {} },
    })
    // Webhook should return 200 without inserting order
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test — vérifier qu'il passe (smoke test)**

```bash
npx vitest run app/api/webhooks/stripe/route.test.ts
```

Expected: 1 test PASS.

- [ ] **Step 3: Créer `app/api/webhooks/stripe/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as any
  const userId = session.metadata?.user_id
  const items: Array<{ id: string; quantity: number; unit_price: number }> =
    JSON.parse(session.metadata?.items || '[]')

  if (!userId || !items.length) {
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Créer la commande
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      stripe_session_id: session.id,
      status: 'paid',
      total: session.amount_total / 100,
    })
    .select('id')
    .single()

  if (orderError) {
    console.error('Order insert error:', orderError)
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
  }

  // Insérer les items
  const { error: itemsError } = await supabase.from('order_items').insert(
    items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))
  )

  if (itemsError) {
    console.error('Order items insert error:', itemsError)
    return NextResponse.json({ error: 'Order items creation failed' }, { status: 500 })
  }

  // Décrémenter le stock (RPC atomique défini dans la migration SQL)
  for (const item of items) {
    await supabase.rpc('decrement_stock', { product_id: item.id, qty: item.quantity })
  }

  return NextResponse.json({ received: true })
}

// Désactiver le body parser Next.js (requis pour Stripe signature)
export const config = { api: { bodyParser: false } }
```

> **Note :** La fonction `decrement_stock` est définie dans `supabase/migrations/001_initial.sql` — elle est déjà appliquée à l'étape Task 2.

- [ ] **Step 4: Configurer le webhook dans le Dashboard Stripe**

Dashboard Stripe → Webhooks → Add endpoint :
- URL : `https://[votre-domaine]/api/webhooks/stripe` (après deploy Vercel)
- Events : `checkout.session.completed`
- Copier le `STRIPE_WEBHOOK_SECRET` → l'ajouter à `.env.local`

Pour tester en local :
```bash
npx stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Stripe webhook handler — creates orders and decrements stock"
```

---

## Task 15: Pages Compte Utilisateur

**Files:**
- Create: `app/[locale]/account/page.tsx`
- Create: `app/[locale]/account/orders/page.tsx`
- Create: `app/[locale]/account/orders/[id]/page.tsx`

- [ ] **Step 1: Créer `app/[locale]/account/page.tsx`**

```typescript
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/actions/auth'
import Button from '@/components/ui/Button'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = await getLocale()
  const t = await getTranslations('account')

  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen pt-28 px-8 md:px-16 pb-16">
      <p className="font-mono text-[9px] tracking-[0.4em] text-muted mb-12">{t('title')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border max-w-2xl">
        <div className="bg-void p-8">
          <p className="font-mono text-[8px] tracking-[0.3em] text-muted mb-3">EMAIL</p>
          <p className="font-mono text-[11px] tracking-[0.1em] text-ice">{user.email}</p>
        </div>
        <div className="bg-void p-8">
          <p className="font-mono text-[8px] tracking-[0.3em] text-muted mb-3">{t('orders').toUpperCase()}</p>
          <p className="font-mono text-[11px] tracking-[0.1em] text-ice">{count ?? 0}</p>
        </div>
      </div>

      <div className="flex gap-4 mt-12">
        <Link href={`/${locale}/account/orders`}>
          <Button variant="ghost">{t('orders')} →</Button>
        </Link>
        <form action={signOut.bind(null, locale)}>
          <Button variant="ghost" type="submit">DÉCONNEXION</Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Créer `app/[locale]/account/orders/page.tsx`**

```typescript
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = await getLocale()
  const t = await getTranslations('account')

  if (!user) redirect(`/${locale}/login`)

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name_fr, name_en))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen pt-28 px-8 md:px-16 pb-16">
      <p className="font-mono text-[9px] tracking-[0.4em] text-muted mb-12">{t('orders')}</p>

      {!orders?.length ? (
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted">{t('noOrders')}</p>
      ) : (
        <div className="space-y-px max-w-2xl">
          {orders.map(order => (
            <Link
              key={order.id}
              href={`/${locale}/account/orders/${order.id}`}
              className="block bg-surface hover:bg-elevated transition-colors p-6 border-b border-border"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-mono text-[9px] tracking-[0.3em] text-muted mb-1">
                    {t('orderNumber')} #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="font-mono text-[10px] tracking-[0.1em] text-ice">
                    {order.order_items?.map((item: any) => {
                      const name = locale === 'fr' ? item.products?.name_fr : item.products?.name_en
                      return `${name} × ${item.quantity}`
                    }).join(' · ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[11px] tracking-widest text-ice mb-2">
                    {formatPrice(order.total, locale)}
                  </p>
                  <Badge active={order.status === 'delivered'}>
                    {(t as any)(`status.${order.status}`)}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Créer `app/[locale]/account/orders/[id]/page.tsx`**

```typescript
import { notFound, redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

export default async function OrderDetailPage({ params }: { params: { id: string; locale: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = await getLocale()
  const t = await getTranslations('account')

  if (!user) redirect(`/${locale}/login`)

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name_fr, name_en, slug))')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!order) notFound()

  return (
    <div className="min-h-screen pt-28 px-8 md:px-16 pb-16">
      <div className="flex items-center gap-4 mb-12">
        <p className="font-mono text-[9px] tracking-[0.4em] text-muted">
          {t('orderNumber')} #{order.id.slice(0, 8).toUpperCase()}
        </p>
        <Badge active={order.status === 'delivered'}>
          {(t as any)(`status.${order.status}`)}
        </Badge>
      </div>

      <div className="max-w-md space-y-px mb-8">
        {order.order_items?.map((item: any) => {
          const name = locale === 'fr' ? item.products?.name_fr : item.products?.name_en
          return (
            <div key={item.id} className="flex justify-between items-center py-4 border-b border-border">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-ice">{name?.toUpperCase()}</p>
                <p className="font-mono text-[8px] tracking-[0.2em] text-muted mt-1">× {item.quantity}</p>
              </div>
              <p className="font-mono text-[10px] tracking-widest text-muted">
                {formatPrice(item.unit_price * item.quantity, locale)}
              </p>
            </div>
          )
        })}
        <div className="flex justify-between items-center py-4">
          <span className="font-mono text-[9px] tracking-[0.3em] text-muted">TOTAL</span>
          <span className="font-mono text-lg tracking-widest text-ice">{formatPrice(order.total, locale)}</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: account dashboard, orders list, order detail pages"
```

---

## Task 16: Page About

**Files:**
- Create: `app/[locale]/about/page.tsx`

- [ ] **Step 1: Créer `app/[locale]/about/page.tsx`**

```typescript
import { getTranslations } from 'next-intl/server'

export default async function AboutPage() {
  const t = await getTranslations('about')
  const values = t.raw('values') as string[]

  return (
    <div className="min-h-screen pt-28 px-8 md:px-16 pb-16 flex flex-col justify-center max-w-2xl">
      <p className="font-mono text-[9px] tracking-[0.4em] text-muted mb-8">
        {t('title')}
      </p>
      <p className="font-sans text-2xl md:text-3xl font-light leading-relaxed tracking-[0.05em] text-ice mb-16">
        {t('body')}
      </p>
      <div className="flex gap-8">
        {values.map((v: string) => (
          <div key={v} className="font-mono text-[8px] tracking-[0.4em] text-muted border-t border-border pt-4">
            {v}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: about page"
```

---

## Task 17: Configuration Vercel + Variables d'environnement

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Créer `vercel.json`**

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

- [ ] **Step 2: S'assurer que `npm run build` passe en local**

```bash
npm run build
```

Expected: Build réussit sans erreurs TypeScript ni ESLint bloquants.

Corriger toutes les erreurs TypeScript avant de continuer.

- [ ] **Step 3: Push vers GitHub**

```bash
git remote add origin https://github.com/<ton-username>/capsule-store.git
git push -u origin main
```

- [ ] **Step 4: Configurer le projet Vercel**

1. Aller sur vercel.com → New Project → importer le dépôt GitHub
2. Framework preset : Next.js (auto-détecté)
3. Ajouter toutes les variables d'environnement depuis `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_APP_URL` → URL Vercel de production

- [ ] **Step 5: Mettre à jour le webhook Stripe**

Dashboard Stripe → Webhooks → Endpoint URL → remplacer `localhost:3000` par l'URL Vercel de production.
Copier le nouveau `STRIPE_WEBHOOK_SECRET` → mettre à jour dans Vercel Environment Variables → Redeploy.

- [ ] **Step 6: Vérification finale**

- [ ] Homepage charge avec la scène 3D (aucune erreur console)
- [ ] Page produit : viewer 3D interactif, drag fonctionne, bouton "Ajouter au panier" actif
- [ ] Badge panier dans la navbar s'incrémente
- [ ] Inscription / connexion fonctionnelles
- [ ] Checkout Stripe redirect vers page de test Stripe (carte test : `4242 4242 4242 4242`)
- [ ] Après paiement : redirect `/order-success`, panier vidé
- [ ] Commande visible dans `/account/orders`
- [ ] Switch FR ↔ EN fonctionne sur toutes les pages

- [ ] **Step 7: Commit final**

```bash
git add vercel.json
git commit -m "feat: Vercel config and production deployment checklist"
```

---

## Résumé des variables d'environnement

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dashboard Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard Supabase → Settings → API |
| `STRIPE_SECRET_KEY` | Dashboard Stripe → Developers → API Keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Dashboard Stripe → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Dashboard Stripe → Webhooks → Endpoint signing secret |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` en local, URL Vercel en production |

## Carte de test Stripe

| Champ | Valeur |
|---|---|
| Numéro | `4242 4242 4242 4242` |
| Expiration | N'importe quelle date future |
| CVC | N'importe quel 3 chiffres |
