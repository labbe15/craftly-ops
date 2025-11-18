-- =====================================================
-- CRAFTLY OPS - COMPLETE SCHEMA EXTENSION
-- Migration complète pour toutes les fonctionnalités
-- Date: 2025-11-18
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS & TYPES
-- =====================================================

-- Extension pour recherche full-text
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Types ENUM personnalisés
DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('lead', 'quoted', 'won', 'in_progress', 'completed', 'cancelled', 'on_hold');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM ('materials', 'tools', 'transport', 'subcontractor', 'admin', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'user', 'accountant');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. EXTENSION TABLE CLIENTS
-- =====================================================

-- Ajouter colonnes manquantes aux clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'individual' CHECK (type IN ('individual', 'company')),
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS mobile TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'France',
  ADD COLUMN IF NOT EXISTS gps_coordinates POINT,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'net30',
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS iban TEXT,
  ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_invoices INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_project_value NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_followup_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Mettre à jour la colonne name pour être nullable (au cas où on utilise first_name/last_name)
ALTER TABLE public.clients ALTER COLUMN name DROP NOT NULL;

-- Créer un index pour la recherche géographique
CREATE INDEX IF NOT EXISTS idx_clients_gps ON public.clients USING GIST (gps_coordinates);

-- Index pour recherche full-text
CREATE INDEX IF NOT EXISTS idx_clients_search ON public.clients
  USING gin(to_tsvector('french', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(company_name, '')));

-- =====================================================
-- 3. CONTACTS (plusieurs contacts par client entreprise)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  position TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_billing BOOLEAN DEFAULT false,
  is_decision_maker BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_client ON public.contacts(client_id);

-- =====================================================
-- 4. FOURNISSEURS (SUPPLIERS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  website TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'France',
  siret TEXT,
  vat_number TEXT,
  payment_terms TEXT DEFAULT 'net30',
  notes TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_org ON public.suppliers(org_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active);

-- =====================================================
-- 5. CATÉGORIES (pour produits, services, dépenses)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('product', 'service', 'expense')),
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_org ON public.categories(org_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);

-- =====================================================
-- 6. EXTENSION TABLE ITEMS (ajout catégories, stock, images)
-- =====================================================

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'service' CHECK (type IN ('product', 'service')),
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplier_reference TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_supplier ON public.items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_items_sku ON public.items(sku);

-- =====================================================
-- 7. PROJETS / CHANTIERS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,

  -- Informations générales
  number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('renovation', 'construction', 'furniture', 'plumbing', 'electricity', 'painting', 'custom')),
  status project_status DEFAULT 'lead',
  priority project_priority DEFAULT 'medium',

  -- Dates
  start_date DATE,
  end_date DATE,
  deadline DATE,

  -- Localisation
  address TEXT,
  postal_code TEXT,
  city TEXT,
  gps_coordinates POINT,

  -- Finances
  budget_quoted NUMERIC(12,2) DEFAULT 0,
  budget_actual NUMERIC(12,2) DEFAULT 0,
  total_invoiced NUMERIC(12,2) DEFAULT 0,
  total_paid NUMERIC(12,2) DEFAULT 0,
  margin_percentage NUMERIC(5,2),
  estimated_hours NUMERIC(8,2),
  actual_hours NUMERIC(8,2) DEFAULT 0,

  -- Gestion
  assigned_to UUID, -- user_id
  team_members JSONB DEFAULT '[]'::jsonb,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),

  -- Métadonnées
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_projects_org ON public.projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned ON public.projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON public.projects(start_date, end_date);

-- =====================================================
-- 8. TÂCHES PROJET
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo',
  priority project_priority DEFAULT 'medium',

  assigned_to UUID, -- user_id
  due_date DATE,
  completed_at TIMESTAMPTZ,

  estimated_hours NUMERIC(6,2),
  actual_hours NUMERIC(6,2) DEFAULT 0,

  parent_task_id UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,

  checklist JSONB DEFAULT '[]'::jsonb,
  tags TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON public.project_tasks(parent_task_id);

-- =====================================================
-- 9. MATÉRIAUX PROJET
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT DEFAULT 'u',
  unit_price NUMERIC(10,2) DEFAULT 0,
  total_price NUMERIC(10,2) DEFAULT 0,

  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'ordered', 'delivered', 'used')),
  ordered_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_project ON public.project_materials(project_id);
CREATE INDEX IF NOT EXISTS idx_materials_status ON public.project_materials(status);

-- =====================================================
-- 10. ÉQUIPE PROJET
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_team (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT CHECK (role IN ('manager', 'technician', 'assistant', 'subcontractor')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_team_project ON public.project_team(project_id);
CREATE INDEX IF NOT EXISTS idx_team_user ON public.project_team(user_id);

-- =====================================================
-- 11. POINTAGES TEMPS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,

  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_hours NUMERIC(6,2),

  description TEXT,
  is_billable BOOLEAN DEFAULT true,
  hourly_rate NUMERIC(8,2),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_project ON public.time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_user ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_dates ON public.time_entries(start_time, end_time);

-- =====================================================
-- 12. DÉPENSES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,

  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT,
  description TEXT NOT NULL,

  amount_ht NUMERIC(10,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 20.00,
  tax_amount NUMERIC(10,2),
  amount_ttc NUMERIC(10,2) NOT NULL,

  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'check')),
  receipt_url TEXT,

  is_billable BOOLEAN DEFAULT false,
  billed_to_client BOOLEAN DEFAULT false,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,

  tags TEXT[],
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_expenses_org ON public.expenses(org_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier ON public.expenses(supplier_id);

-- =====================================================
-- 13. DOCUMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,

  -- Relations polymorphiques
  related_type TEXT CHECK (related_type IN ('client', 'project', 'quote', 'invoice', 'supplier', 'expense')),
  related_id UUID,

  type TEXT CHECK (type IN ('contract', 'photo', 'plan', 'certificate', 'invoice', 'receipt', 'other')),
  category TEXT,

  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,

  uploaded_by UUID,
  tags TEXT[],
  is_signed BOOLEAN DEFAULT false,
  signature_date TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents(org_id);
CREATE INDEX IF NOT EXISTS idx_documents_related ON public.documents(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON public.documents USING gin(tags);

-- =====================================================
-- 14. ACTIVITY LOGS (Timeline)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID,

  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'sent', 'viewed', 'signed', 'paid', 'accepted', 'refused')),
  description TEXT,

  metadata JSONB DEFAULT '{}'::jsonb,
  changes JSONB DEFAULT '{}'::jsonb, -- old_value, new_value

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_org ON public.activity_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_logs(created_at DESC);

-- =====================================================
-- 15. TAGS (système universel)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  description TEXT,
  category TEXT, -- 'client', 'project', 'product', etc.
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_org_name ON public.tags(org_id, LOWER(name));
CREATE INDEX IF NOT EXISTS idx_tags_category ON public.tags(category);

-- =====================================================
-- 16. TEMPLATES (emails, PDF, contrats)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,

  type TEXT NOT NULL CHECK (type IN ('email', 'quote_pdf', 'invoice_pdf', 'contract', 'sms')),
  name TEXT NOT NULL,
  description TEXT,

  subject TEXT, -- pour emails
  content TEXT NOT NULL, -- HTML ou JSON
  variables JSONB DEFAULT '[]'::jsonb, -- variables disponibles

  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  settings JSONB DEFAULT '{}'::jsonb, -- couleurs, fonts, etc.

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_templates_org ON public.templates(org_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON public.templates(type);

-- =====================================================
-- 17. AI CONVERSATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,

  title TEXT,
  messages JSONB DEFAULT '[]'::jsonb, -- {role, content, timestamp}[]
  context JSONB DEFAULT '{}'::jsonb,

  tokens_used INTEGER DEFAULT 0,
  model TEXT DEFAULT 'gpt-4',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_session ON public.ai_conversations(session_id);

-- =====================================================
-- 18. WORKFLOWS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,

  name TEXT NOT NULL,
  description TEXT,

  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('event', 'schedule', 'webhook', 'manual')),
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,

  actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{type, config, order}]
  conditions JSONB DEFAULT '[]'::jsonb,

  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_workflows_org ON public.workflows(org_id);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON public.workflows(is_active);

-- =====================================================
-- 19. WORKFLOW EXECUTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,

  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),

  trigger_data JSONB DEFAULT '{}'::jsonb,
  execution_log JSONB DEFAULT '[]'::jsonb,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_executions_workflow ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON public.workflow_executions(status);

-- =====================================================
-- 20. NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,

  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,

  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- =====================================================
-- 21. SAVED REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.saved_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,

  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,

  filters JSONB DEFAULT '{}'::jsonb,
  metrics JSONB DEFAULT '[]'::jsonb,
  dimensions JSONB DEFAULT '[]'::jsonb,

  schedule JSONB, -- {frequency, day, time, recipients}
  is_active BOOLEAN DEFAULT true,

  last_generated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_org ON public.saved_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON public.saved_reports(user_id);

-- =====================================================
-- 22. USERS EXTENDED (pour multi-users)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,

  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  position TEXT,

  role user_role DEFAULT 'user',
  permissions JSONB DEFAULT '[]'::jsonb,

  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,

  preferences JSONB DEFAULT '{}'::jsonb,

  invited_by UUID,
  invited_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.user_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.user_profiles(role);

-- =====================================================
-- 23. INTÉGRATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,

  service TEXT NOT NULL CHECK (service IN ('google_calendar', 'stripe', 'twilio', 'slack', 'zapier', 'n8n', 'google_drive')),

  credentials JSONB, -- encrypted
  settings JSONB DEFAULT '{}'::jsonb,

  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_integrations_org_service ON public.integrations(org_id, service);

-- =====================================================
-- 24. RLS POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (SELECT, INSERT, UPDATE, DELETE pour tous les utilisateurs authentifiés)
-- Note: Pour une vraitable multi-tenant, il faudrait filtrer par org_id

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'contacts', 'suppliers', 'categories', 'projects', 'project_tasks',
      'project_materials', 'project_team', 'time_entries', 'expenses',
      'documents', 'activity_logs', 'tags', 'templates', 'ai_conversations',
      'workflows', 'workflow_executions', 'notifications', 'saved_reports',
      'user_profiles', 'integrations'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can view %s" ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY "Users can view %s" ON public.%I FOR SELECT USING (auth.uid() IS NOT NULL)', table_name, table_name);

    EXECUTE format('DROP POLICY IF EXISTS "Users can insert %s" ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY "Users can insert %s" ON public.%I FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)', table_name, table_name);

    EXECUTE format('DROP POLICY IF EXISTS "Users can update %s" ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY "Users can update %s" ON public.%I FOR UPDATE USING (auth.uid() IS NOT NULL)', table_name, table_name);

    EXECUTE format('DROP POLICY IF EXISTS "Users can delete %s" ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY "Users can delete %s" ON public.%I FOR DELETE USING (auth.uid() IS NOT NULL)', table_name, table_name);
  END LOOP;
END $$;

-- =====================================================
-- 25. TRIGGERS updated_at
-- =====================================================

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'contacts', 'suppliers', 'categories', 'projects', 'project_tasks',
      'expenses', 'documents', 'templates', 'ai_conversations', 'workflows',
      'saved_reports', 'user_profiles', 'integrations'
    )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I', table_name, table_name);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', table_name, table_name);
  END LOOP;
END $$;

-- =====================================================
-- 26. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour calculer automatiquement la durée des time_entries
CREATE OR REPLACE FUNCTION calculate_time_entry_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_hours := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER time_entry_duration_trigger
  BEFORE INSERT OR UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_time_entry_duration();

-- Fonction pour mettre à jour les heures réelles d'un projet
CREATE OR REPLACE FUNCTION update_project_actual_hours()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.projects
  SET actual_hours = (
    SELECT COALESCE(SUM(duration_hours), 0)
    FROM public.time_entries
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
  )
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_hours_on_time_entry
  AFTER INSERT OR UPDATE OR DELETE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_project_actual_hours();

-- Fonction pour incrémenter usage_count des tags
CREATE OR REPLACE FUNCTION increment_tag_usage()
RETURNS TRIGGER AS $$
DECLARE
  tag_name TEXT;
BEGIN
  IF NEW.tags IS NOT NULL THEN
    FOREACH tag_name IN ARRAY NEW.tags
    LOOP
      UPDATE public.tags
      SET usage_count = usage_count + 1
      WHERE name = tag_name AND org_id = NEW.org_id;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 27. VUES UTILES
-- =====================================================

-- Vue pour les projets avec infos clients
CREATE OR REPLACE VIEW public.projects_with_client AS
SELECT
  p.*,
  c.name as client_name,
  c.email as client_email,
  c.phone as client_phone
FROM public.projects p
LEFT JOIN public.clients c ON p.client_id = c.id;

-- Vue pour les tâches avec infos projet
CREATE OR REPLACE VIEW public.tasks_with_project AS
SELECT
  t.*,
  p.name as project_name,
  p.status as project_status
FROM public.project_tasks t
LEFT JOIN public.projects p ON t.project_id = p.id;

-- =====================================================
-- 28. INDEXES DE PERFORMANCE
-- =====================================================

-- Index composites pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_projects_client_status ON public.projects(client_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON public.project_tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_project_date ON public.expenses(project_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date ON public.time_entries(user_id, start_time DESC);

-- Index pour tri et pagination
CREATE INDEX IF NOT EXISTS idx_projects_created_desc ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

COMMENT ON TABLE public.projects IS 'Projets/chantiers avec gestion complète';
COMMENT ON TABLE public.project_tasks IS 'Tâches associées aux projets';
COMMENT ON TABLE public.time_entries IS 'Pointages de temps par projet/tâche';
COMMENT ON TABLE public.expenses IS 'Dépenses avec liaison optionnelle aux projets';
COMMENT ON TABLE public.workflows IS 'Automatisations configurables';
COMMENT ON TABLE public.ai_conversations IS 'Historique des conversations avec l''IA';
