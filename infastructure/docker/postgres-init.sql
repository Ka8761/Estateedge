-- EstateEdge Database Schema
-- PostgreSQL 15

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Users & Auth ─────────────────────────────────────────────────────────────

CREATE TABLE brokerages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  plan VARCHAR(50) DEFAULT 'growth',       -- starter | growth | enterprise
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brokerage_id UUID REFERENCES brokerages(id) ON DELETE SET NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'agent',        -- agent | team_lead | brokerage_admin | super_admin
  avatar_url TEXT,
  phone VARCHAR(30),
  license_number VARCHAR(100),
  bio TEXT,
  settings JSONB DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Sites & Pages ────────────────────────────────────────────────────────────

CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brokerage_id UUID REFERENCES brokerages(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  domain VARCHAR(255),                     -- custom domain
  subdomain VARCHAR(100),                  -- slug.estateedge.io
  status VARCHAR(50) DEFAULT 'draft',      -- draft | published | archived
  theme JSONB DEFAULT '{}',                -- colors, fonts, spacing
  settings JSONB DEFAULT '{}',
  seo JSONB DEFAULT '{}',                  -- global SEO settings
  ai_generated BOOLEAN DEFAULT false,
  generation_prompt TEXT,                  -- original AI generation prompt
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  page_type VARCHAR(50) DEFAULT 'custom',  -- home | about | listings | neighborhoods | contact | custom
  content JSONB DEFAULT '{"blocks":[]}',   -- block-based content tree
  seo JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, slug)
);

CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  block_type VARCHAR(100) NOT NULL,        -- hero | listings-grid | bio | testimonials | cta | market-report
  content JSONB DEFAULT '{}',
  styles JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Site Generation Jobs ─────────────────────────────────────────────────────

CREATE TABLE generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending',    -- pending | processing | completed | failed
  input JSONB NOT NULL,                    -- user prompt + context
  output JSONB,                            -- generated site spec
  ai_model VARCHAR(100),
  tokens_used INT,
  duration_ms INT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Leads ────────────────────────────────────────────────────────────────────

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(30),
  message TEXT,
  source VARCHAR(100),                     -- contact-form | listing-inquiry | valuation | newsletter
  status VARCHAR(50) DEFAULT 'new',        -- new | contacted | qualified | converted | lost
  score INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Analytics ────────────────────────────────────────────────────────────────

CREATE TABLE site_analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  page_views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  leads_captured INT DEFAULT 0,
  avg_session_duration_sec INT DEFAULT 0,
  bounce_rate DECIMAL(5,2),
  top_pages JSONB DEFAULT '[]',
  traffic_sources JSONB DEFAULT '{}',
  UNIQUE(site_id, date)
);

-- ─── AI Content History ───────────────────────────────────────────────────────

CREATE TABLE ai_content_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  content_type VARCHAR(100) NOT NULL,      -- bio | listing-description | neighborhood | seo-meta | market-report
  prompt TEXT NOT NULL,
  result TEXT NOT NULL,
  model VARCHAR(100),
  tokens_used INT,
  rating INT,                              -- user feedback 1-5
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_users_brokerage ON users(brokerage_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sites_user ON sites(user_id);
CREATE INDEX idx_sites_status ON sites(status);
CREATE INDEX idx_pages_site ON pages(site_id);
CREATE INDEX idx_leads_site ON leads(site_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_analytics_site_date ON site_analytics_daily(site_id, date DESC);
CREATE INDEX idx_gen_jobs_user ON generation_jobs(user_id);
CREATE INDEX idx_gen_jobs_status ON generation_jobs(status);

-- Full-text search on sites
CREATE INDEX idx_sites_name_search ON sites USING gin(to_tsvector('english', name));