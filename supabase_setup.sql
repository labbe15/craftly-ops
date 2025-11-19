-- =====================================================
-- CRAFTLY OPS - INSTALLATION COMPLÈTE
-- Script SQL pour Supabase - Exécutez ce fichier entier
-- =====================================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABLES PRINCIPALES
-- =====================================================

-- Table org_settings
CREATE TABLE IF NOT EXISTS public.org_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL UNIQUE,
  company_name TEXT,
  vat_number TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  siret TEXT,
  brand_primary TEXT DEFAULT '#3b82f6',
  brand_secondary TEXT DEFAULT '#1e40af',
  quote_prefix TEXT DEFAULT 'DEV-',
  invoice_prefix TEXT DEFAULT 'FACT-',
  default_vat_rate NUMERIC(5,2) DEFAULT 20.00,
  payment_terms_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  company_name TEXT,
  siret TEXT,
  vat_number TEXT,
  notes TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table items (produits/services)
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit_price_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  unit TEXT DEFAULT 'u',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table quotes (devis)
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'refused', 'expired')),
  date DATE DEFAULT CURRENT_DATE,
  expires_at DATE,
  terms_text TEXT,
  notes TEXT,
  totals_ht NUMERIC(10,2) DEFAULT 0,
  totals_vat NUMERIC(10,2) DEFAULT 0,
  totals_ttc NUMERIC(10,2) DEFAULT 0,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  template_id TEXT DEFAULT 'modern',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table quote_items
CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  qty NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'u',
  unit_price_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  line_total_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table invoices (factures)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  terms_text TEXT,
  notes TEXT,
  totals_ht NUMERIC(10,2) DEFAULT 0,
  totals_vat NUMERIC(10,2) DEFAULT 0,
  totals_ttc NUMERIC(10,2) DEFAULT 0,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  template_id TEXT DEFAULT 'modern',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table invoice_items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  qty NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'u',
  unit_price_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  line_total_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'quoted', 'won', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  start_date DATE,
  end_date DATE,
  budget_quoted NUMERIC(12,2) DEFAULT 0,
  budget_actual NUMERIC(12,2) DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table workflows
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table workflow_executions
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  trigger_data JSONB DEFAULT '{}'::jsonb,
  execution_log JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Table user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'manager', 'user', 'accountant')),
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table ai_conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  title TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,
  priority TEXT DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(org_id);
CREATE INDEX IF NOT EXISTS idx_items_org ON public.items(org_id);
CREATE INDEX IF NOT EXISTS idx_quotes_org ON public.quotes(org_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client ON public.quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON public.projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_workflows_org ON public.workflows(org_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies simples : tous les utilisateurs authentifiés peuvent tout faire
-- (À affiner plus tard selon vos besoins de sécurité)

CREATE POLICY "Authenticated users can do everything" ON public.org_settings FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON public.clients FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON public.items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON public.quotes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON public.quote_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON public.invoices FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON public.invoice_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON public.projects FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON public.workflows FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON public.workflow_executions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON public.user_profiles FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON public.ai_conversations FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON public.notifications FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_org_settings_updated_at BEFORE UPDATE ON public.org_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONNÉES INITIALES (Optionnel)
-- =====================================================

-- Insérer un paramétrage par défaut
-- Remplacez 'YOUR_ORG_ID' par l'UUID de votre choix ou utilisez uuid_generate_v4()
INSERT INTO public.org_settings (org_id, company_name)
VALUES (uuid_generate_v4(), 'Craftly Ops')
ON CONFLICT (org_id) DO NOTHING;

-- =====================================================
-- FIN DE L'INSTALLATION
-- =====================================================
-- Votre base de données Craftly Ops est prête ! 🎉
