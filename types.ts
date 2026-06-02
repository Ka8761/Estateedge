// EstateEdge — Shared Types
// Used across all backend services and frontend

export type UserRole = 'agent' | 'team_lead' | 'brokerage_admin' | 'super_admin';
export type SiteStatus = 'draft' | 'published' | 'archived';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type Plan = 'starter' | 'growth' | 'enterprise';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  brokerageId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  licenseNumber?: string;
  bio?: string;
  settings: Record<string, unknown>;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Brokerage {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: Plan;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Site ─────────────────────────────────────────────────────────────────────

export interface SiteTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  spacing: 'compact' | 'comfortable' | 'spacious';
}

export interface SiteSEO {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImageUrl?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
}

export interface Site {
  id: string;
  userId: string;
  brokerageId?: string;
  name: string;
  slug: string;
  domain?: string;
  subdomain: string;
  status: SiteStatus;
  theme: SiteTheme;
  settings: Record<string, unknown>;
  seo: SiteSEO;
  aiGenerated: boolean;
  generationPrompt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Page & Blocks ────────────────────────────────────────────────────────────

export type PageType = 'home' | 'about' | 'listings' | 'neighborhoods' | 'contact' | 'custom';
export type BlockType =
  | 'hero'
  | 'listings-grid'
  | 'featured-listing'
  | 'bio'
  | 'testimonials'
  | 'cta'
  | 'market-report'
  | 'neighborhood-guide'
  | 'stats-bar'
  | 'contact-form'
  | 'video-embed'
  | 'text-content'
  | 'image-gallery';

export interface Block {
  id: string;
  pageId: string;
  blockType: BlockType;
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  pageType: PageType;
  content: { blocks: Block[] };
  seo: SiteSEO;
  status: 'draft' | 'published';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── AI Generation ────────────────────────────────────────────────────────────

export interface SiteGenerationInput {
  agentName: string;
  agentTitle?: string;
  brokerage?: string;
  location: string;
  specialties: string[];
  tone: 'luxury' | 'modern' | 'professional' | 'friendly' | 'bold';
  colorPreference?: string;
  targetAudience?: string;
  additionalContext?: string;
}

export interface GeneratedSiteSpec {
  name: string;
  tagline: string;
  theme: SiteTheme;
  seo: SiteSEO;
  pages: Array<{
    title: string;
    slug: string;
    pageType: PageType;
    blocks: Array<{
      blockType: BlockType;
      content: Record<string, unknown>;
    }>;
  }>;
}

export interface GenerationJob {
  id: string;
  userId: string;
  siteId?: string;
  status: JobStatus;
  input: SiteGenerationInput;
  output?: GeneratedSiteSpec;
  aiModel?: string;
  tokensUsed?: number;
  durationMs?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  siteId: string;
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  message?: string;
  source: string;
  status: LeadStatus;
  score: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Kafka Events ─────────────────────────────────────────────────────────────

export const KAFKA_TOPICS = {
  // Site events
  SITE_CREATED: 'site.created',
  SITE_PUBLISHED: 'site.published',
  SITE_UPDATED: 'site.updated',

  // AI events
  AI_GENERATION_REQUESTED: 'ai.generation.requested',
  AI_GENERATION_COMPLETED: 'ai.generation.completed',
  AI_CONTENT_REQUESTED: 'ai.content.requested',
  AI_CONTENT_COMPLETED: 'ai.content.completed',

  // Lead events
  LEAD_CREATED: 'lead.created',
  LEAD_UPDATED: 'lead.updated',
  LEAD_SCORED: 'lead.scored',

  // Analytics events
  PAGE_VIEWED: 'analytics.page.viewed',
  SESSION_STARTED: 'analytics.session.started',
  SESSION_ENDED: 'analytics.session.ended',
} as const;

export type KafkaTopic = typeof KAFKA_TOPICS[keyof typeof KAFKA_TOPICS];

export interface KafkaMessage<T = unknown> {
  eventId: string;
  topic: KafkaTopic;
  timestamp: string;
  payload: T;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}