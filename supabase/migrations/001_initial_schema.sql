-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Photographers table (extends auth.users)
CREATE TABLE photographers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photographer_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract templates table
CREATE TABLE contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photographer_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photographer_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('wedding', 'portrait')),
  event_date DATE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  contract_template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  contract_text TEXT,
  contract_signed BOOLEAN DEFAULT FALSE,
  contract_signed_at TIMESTAMPTZ,
  contract_signed_by TEXT,
  payment_milestones JSONB DEFAULT '[]'::jsonb,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
  portal_token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'contract_sent', 'contract_signed', 'payment_pending', 'completed')),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_clients_photographer_id ON clients(photographer_id);
CREATE INDEX idx_bookings_photographer_id ON bookings(photographer_id);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_portal_token ON bookings(portal_token);
CREATE INDEX idx_contract_templates_photographer_id ON contract_templates(photographer_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE photographers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Photographers policies
CREATE POLICY "Photographers can view own profile"
  ON photographers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Photographers can update own profile"
  ON photographers FOR UPDATE
  USING (auth.uid() = user_id);

-- Clients policies
CREATE POLICY "Photographers can view own clients"
  ON clients FOR SELECT
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can update own clients"
  ON clients FOR UPDATE
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can delete own clients"
  ON clients FOR DELETE
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

-- Contract templates policies
CREATE POLICY "Photographers can view own templates"
  ON contract_templates FOR SELECT
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can insert own templates"
  ON contract_templates FOR INSERT
  WITH CHECK (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can update own templates"
  ON contract_templates FOR UPDATE
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can delete own templates"
  ON contract_templates FOR DELETE
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

-- Bookings policies
CREATE POLICY "Photographers can view own bookings"
  ON bookings FOR SELECT
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can insert own bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can update own bookings"
  ON bookings FOR UPDATE
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can delete own bookings"
  ON bookings FOR DELETE
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

-- Function to automatically create photographer profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.photographers (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create photographer profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_photographers_updated_at BEFORE UPDATE ON photographers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON contract_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



