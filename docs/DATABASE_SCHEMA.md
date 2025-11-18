# CRAFTLY OPS - STRUCTURE BASE DE DONNÉES COMPLÈTE

## 📊 Vue d'ensemble

Cette base de données PostgreSQL (via Supabase) implémente un CRM/ERP complet pour artisans avec :
- ✅ **28 tables** principales
- ✅ **Row Level Security (RLS)** sur toutes les tables
- ✅ **Indexes optimisés** pour performance
- ✅ **Triggers automatiques** (updated_at, calculs)
- ✅ **Types ENUM personnalisés**
- ✅ **Vues utilitaires**
- ✅ **Fonctions PostgreSQL**

---

## 🗂️ TABLES PAR MODULE

### MODULE : CLIENTS & CONTACTS

#### `clients` (étendue)
Gestion complète des clients (particuliers & entreprises)

**Champs principaux:**
- `id`, `org_id`, `type` (individual/company)
- `first_name`, `last_name`, `company_name`
- `email`, `phone`, `mobile`
- `address`, `postal_code`, `city`, `country`
- `gps_coordinates` (POINT - géolocalisation)
- `siret`, `vat_number`, `legal_form`, `registration_city`
- `payment_terms`, `payment_method`, `iban`
- `total_revenue`, `total_invoices`, `average_project_value`
- `last_contact_date`, `next_followup_date`
- `satisfaction_score` (1-5), `is_active`
- `tags`, `custom_fields` (JSONB)

**Indexes:**
- GiST sur `gps_coordinates` (recherche géographique)
- GIN sur recherche full-text (nom, email, company)

#### `contacts`
Contacts multiples par client entreprise

**Champs:**
- `client_id` (FK), `first_name`, `last_name`
- `position`, `email`, `phone`, `mobile`
- `is_primary`, `is_billing`, `is_decision_maker`

---

### MODULE : PROJETS / CHANTIERS

#### `projects`
Gestion complète des chantiers

**Champs:**
- `number` (unique), `name`, `description`, `type`
- `status` (ENUM: lead → cancelled)
- `priority` (ENUM: low → urgent)
- `start_date`, `end_date`, `deadline`
- `address`, `postal_code`, `city`, `gps_coordinates`
- `budget_quoted`, `budget_actual`, `total_invoiced`, `total_paid`
- `margin_percentage`, `estimated_hours`, `actual_hours`
- `assigned_to` (user), `team_members` (JSONB)
- `progress_percentage` (0-100)
- `tags`, `custom_fields`, `attachments`, `notes`
- `client_id` (FK), `quote_id` (FK)

**Statuts possibles:**
- `lead` - Prospect
- `quoted` - Devis envoyé
- `won` - Devis accepté
- `in_progress` - En cours
- `completed` - Terminé
- `cancelled` - Annulé
- `on_hold` - En pause

#### `project_tasks`
Tâches par projet avec hiérarchie

**Champs:**
- `project_id` (FK), `title`, `description`
- `status` (ENUM: todo/in_progress/completed/cancelled)
- `priority`, `assigned_to`, `due_date`, `completed_at`
- `estimated_hours`, `actual_hours`
- `parent_task_id` (sous-tâches), `sort_order`
- `checklist` (JSONB), `tags`

#### `project_materials`
Matériaux nécessaires par projet

**Champs:**
- `project_id` (FK), `item_id` (FK), `supplier_id` (FK)
- `name`, `quantity`, `unit`, `unit_price`, `total_price`
- `status` (planned/ordered/delivered/used)
- `ordered_at`, `delivered_at`

#### `project_team`
Équipe assignée au projet

**Champs:**
- `project_id` (FK), `user_id`, `role`
- `assigned_at`, `removed_at`

#### `time_entries`
Pointages de temps par projet/tâche

**Champs:**
- `project_id` (FK), `task_id` (FK), `user_id`
- `start_time`, `end_time`, `duration_hours` (auto-calculé)
- `description`, `is_billable`, `hourly_rate`

**Trigger:** Calcul automatique de `duration_hours`
**Trigger:** Mise à jour de `actual_hours` dans projects

---

### MODULE : DEVIS & FACTURES

#### `quotes` (existante, étendue)
**Nouveaux champs:**
- `signed` dans status ENUM
- Signature électronique (déjà implémentée)

#### `invoices` (existante)
Factures avec paiements

#### `payments` (existante)
Historique des paiements

---

### MODULE : CATALOGUE

#### `items` (étendue)
Produits et services

**Nouveaux champs:**
- `category_id` (FK), `sku`, `type` (product/service)
- `purchase_price`, `margin_percentage`
- `stock_quantity`, `supplier_id` (FK)
- `supplier_reference`, `image_url`
- `custom_fields` (JSONB)

#### `categories`
Catégories hiérarchiques

**Champs:**
- `parent_id` (FK - sous-catégories)
- `name`, `description`, `type` (product/service/expense)
- `icon`, `color`, `sort_order`, `is_active`

---

### MODULE : FOURNISSEURS & DÉPENSES

#### `suppliers`
Fournisseurs

**Champs:**
- `name`, `email`, `phone`, `website`
- `address`, `postal_code`, `city`, `country`
- `siret`, `vat_number`, `payment_terms`
- `notes`, `tags`, `is_active`

#### `expenses`
Dépenses avec liaison projets

**Champs:**
- `project_id` (FK optionnel), `category_id` (FK), `supplier_id` (FK)
- `date`, `reference`, `description`
- `amount_ht`, `tax_rate`, `tax_amount`, `amount_ttc`
- `payment_method`, `receipt_url`
- `is_billable`, `billed_to_client`, `invoice_id` (FK)
- `tags`, `notes`

---

### MODULE : DOCUMENTS

#### `documents`
Bibliothèque documentaire universelle

**Champs:**
- `related_type`, `related_id` (polymorphique: client/project/quote/invoice/supplier/expense)
- `type` (contract/photo/plan/certificate/invoice/receipt/other)
- `category`, `title`, `description`
- `file_url`, `file_name`, `file_size`, `file_type`
- `uploaded_by`, `tags`
- `is_signed`, `signature_date`
- `metadata` (JSONB)

**Indexes:**
- Composite sur `(related_type, related_id)`
- GIN sur `tags`

---

### MODULE : ACTIVITÉ & TIMELINE

#### `activity_logs`
Journal d'activité complet

**Champs:**
- `entity_type`, `entity_id` (polymorphique)
- `action` (ENUM: created/updated/deleted/sent/viewed/signed/paid/accepted/refused)
- `description`, `metadata` (JSONB), `changes` (JSONB old/new)
- `user_id`, `ip_address`, `user_agent`

**Index:** Créé DESC pour performance timeline

---

### MODULE : TAGS

#### `tags`
Système de tags universel

**Champs:**
- `name`, `color`, `description`, `category`
- `usage_count` (auto-incrémenté)

**Index:** Unique sur `(org_id, LOWER(name))`

---

### MODULE : TEMPLATES

#### `templates`
Templates emails, PDF, contrats, SMS

**Champs:**
- `type` (ENUM: email/quote_pdf/invoice_pdf/contract/sms)
- `name`, `description`, `subject`, `content`
- `variables` (JSONB - {{client.name}}, etc.)
- `is_default`, `is_active`
- `settings` (JSONB - couleurs, fonts)

---

### MODULE : INTELLIGENCE ARTIFICIELLE

#### `ai_conversations`
Historique conversations chatbot

**Champs:**
- `user_id`, `session_id`, `title`
- `messages` (JSONB - [{role, content, timestamp}])
- `context` (JSONB)
- `tokens_used`, `model`

---

### MODULE : AUTOMATISATIONS

#### `workflows`
Workflow builder no-code

**Champs:**
- `name`, `description`
- `trigger_type` (ENUM: event/schedule/webhook/manual)
- `trigger_config` (JSONB)
- `actions` (JSONB - [{type, config, order}])
- `conditions` (JSONB)
- `is_active`, `last_run_at`, `run_count`

#### `workflow_executions`
Logs d'exécution

**Champs:**
- `workflow_id` (FK), `status` (running/completed/failed/cancelled)
- `trigger_data`, `execution_log` (JSONB)
- `started_at`, `completed_at`, `error_message`

---

### MODULE : NOTIFICATIONS

#### `notifications`
Notifications in-app

**Champs:**
- `user_id`, `type`, `title`, `message`, `action_url`
- `priority` (ENUM: low/normal/high/urgent)
- `is_read`, `read_at`
- `metadata` (JSONB)

**Index:** `(user_id, created_at DESC)` pour performance

---

### MODULE : RAPPORTS

#### `saved_reports`
Rapports personnalisés sauvegardés

**Champs:**
- `name`, `description`, `type`
- `filters`, `metrics`, `dimensions` (JSONB)
- `schedule` (JSONB - {frequency, day, time, recipients})
- `is_active`, `last_generated_at`

---

### MODULE : MULTI-UTILISATEURS

#### `user_profiles`
Profils utilisateurs étendus

**Champs:**
- `id` (FK auth.users), `org_id`
- `full_name`, `avatar_url`, `phone`, `position`
- `role` (ENUM: owner/admin/manager/user/accountant)
- `permissions` (JSONB - granulaire)
- `is_active`, `last_login_at`
- `preferences` (JSONB)
- `invited_by`, `invited_at`

**Rôles disponibles:**
- `owner` - Propriétaire (tous droits)
- `admin` - Administrateur
- `manager` - Manager (gestion clients/projets)
- `user` - Utilisateur standard
- `accountant` - Comptable (lecture seule finances)

---

### MODULE : INTÉGRATIONS

#### `integrations`
Connexions services externes

**Champs:**
- `service` (ENUM: google_calendar/stripe/twilio/slack/zapier/n8n/google_drive)
- `credentials` (JSONB encrypted)
- `settings` (JSONB)
- `is_active`, `last_sync_at`, `sync_status`

**Index:** Unique sur `(org_id, service)`

---

## 🔐 SÉCURITÉ (RLS)

Toutes les tables ont **Row Level Security** activée avec 4 policies par défaut :
1. SELECT - Utilisateurs authentifiés
2. INSERT - Utilisateurs authentifiés
3. UPDATE - Utilisateurs authentifiés
4. DELETE - Utilisateurs authentifiés

**Note:** Pour un vrai multi-tenant, les policies devront filtrer par `org_id`.

---

## ⚡ TRIGGERS AUTOMATIQUES

### `update_updated_at_column()`
Appliqué à toutes les tables avec `updated_at` :
- `contacts`, `suppliers`, `categories`, `projects`, `project_tasks`
- `expenses`, `documents`, `templates`, `ai_conversations`
- `workflows`, `saved_reports`, `user_profiles`, `integrations`

### `calculate_time_entry_duration()`
Sur `time_entries` : Calcul automatique de `duration_hours` depuis start/end time

### `update_project_actual_hours()`
Sur `time_entries` : Mise à jour automatique de `actual_hours` dans projects

### `increment_tag_usage()`
Incrémente `usage_count` dans `tags` quand un tag est utilisé

---

## 🎯 VUES UTILITAIRES

### `projects_with_client`
Projets avec informations clients jointes

### `tasks_with_project`
Tâches avec informations projets jointes

---

## 📈 INDEXES DE PERFORMANCE

### Indexes de recherche
- **GIN (full-text)** : `clients` (nom, email, company)
- **GIN (arrays)** : `documents.tags`
- **GiST (geo)** : `clients.gps_coordinates`, `projects.gps_coordinates`

### Indexes composites (requêtes fréquentes)
- `projects(client_id, status)`
- `project_tasks(project_id, status)`
- `expenses(project_id, date DESC)`
- `time_entries(user_id, start_time DESC)`
- `notifications(user_id, created_at DESC)`

### Indexes de tri
- `projects(created_at DESC)`
- `activity_logs(created_at DESC)`

---

## 🔢 TYPES ENUM PERSONNALISÉS

```sql
project_status: lead | quoted | won | in_progress | completed | cancelled | on_hold
project_priority: low | medium | high | urgent
task_status: todo | in_progress | completed | cancelled
expense_category: materials | tools | transport | subcontractor | admin | other
user_role: owner | admin | manager | user | accountant
```

---

## 📊 STATISTIQUES

- **Tables totales:** 28
- **Tables nouvelles:** 18
- **Tables étendues:** 3 (clients, items, quotes)
- **Indexes:** 60+
- **Triggers:** 15+
- **Vues:** 2
- **Fonctions:** 4
- **Types ENUM:** 5
- **RLS Policies:** 80+ (4 par table)

---

## 🚀 UTILISATION

### Appliquer la migration

```bash
# Via Supabase CLI
supabase db push

# Ou via SQL Editor dans Supabase Dashboard
# Copier/coller le contenu de 20251118_complete_schema_extension.sql
```

### Vérifier l'application

```sql
-- Lister toutes les tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Vérifier RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Compter les policies
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
```

---

## 🔄 RELATIONS PRINCIPALES

```
clients
  ├─ contacts (1:N)
  ├─ projects (1:N)
  ├─ quotes (1:N)
  └─ invoices (1:N)

projects
  ├─ project_tasks (1:N)
  ├─ project_materials (1:N)
  ├─ project_team (1:N)
  ├─ time_entries (1:N)
  ├─ expenses (1:N)
  ├─ documents (1:N)
  └─ activity_logs (1:N)

items
  ├─ category (N:1)
  ├─ supplier (N:1)
  ├─ quote_items (1:N)
  └─ invoice_items (1:N)

workflows
  └─ workflow_executions (1:N)
```

---

## ⚠️ NOTES IMPORTANTES

1. **org_id** : Présent partout pour future isolation multi-tenant
2. **JSONB** : Utilisé pour flexibilité (custom_fields, metadata, etc.)
3. **Timestamps** : Toutes les tables ont `created_at` et `updated_at` (où pertinent)
4. **Soft delete** : Pas implémenté (utiliser `is_active` ou `deleted_at` si nécessaire)
5. **Encryption** : Les champs sensibles (credentials) doivent être cryptés côté application

---

## 📚 PROCHAINES ÉTAPES

Après application de cette migration :

1. ✅ Régénérer les types TypeScript Supabase
2. ✅ Créer les services/hooks React Query
3. ✅ Implémenter les pages UI (Projects, Analytics, etc.)
4. ✅ Configurer les intégrations (OpenAI, Stripe, etc.)

---

**Base de données prête pour un CRM/ERP professionnel complet ! 🎉**
