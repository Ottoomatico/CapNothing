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
