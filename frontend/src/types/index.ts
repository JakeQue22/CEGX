// ─── Enums & Unions ──────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'SALES_MANAGER' | 'PROCUREMENT_OFFICER' | 'VIEWER';

export type DealStatus = 'OPEN' | 'WON' | 'LOST';

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENT' | 'FAILED';

export type NotificationType =
  | 'DEAL_CREATED'
  | 'DEAL_STAGE_CHANGED'
  | 'DEAL_WON'
  | 'DEAL_LOST'
  | 'FOLLOW_UP_DUE'
  | 'CAMPAIGN_SENT'
  | 'CAMPAIGN_FAILED'
  | 'SYSTEM';

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  currency: string;
  defaultVatPercent: number;
  defaultAdPercent: number;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSenderName?: string;
  notifyOnDealCreated: boolean;
  notifyOnDealWon: boolean;
  notifyOnDealLost: boolean;
  notifyOnFollowUpDue: boolean;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  country?: string;
  rating?: number;
  isActive?: boolean;
  notes?: string;
  _count?: { products: number; deals: number };
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BulkPricing {
  id: string;
  productId: string;
  minQuantity: number;
  bulkCostPrice: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  baseCostPrice: number;
  vatPercent?: number;
  adPercent?: number;
  categoryId?: string;
  category?: ProductCategory;
  supplierId?: string;
  supplier?: Supplier;
  bulkPricings?: BulkPricing[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  title: string;
  status: DealStatus;
  stageId: string;
  stage?: PipelineStage;
  supplierId?: string;
  supplier?: Supplier;
  productId?: string;
  product?: Product;
  assignedUserId?: string;
  assignedUser?: User;
  quantity: number;
  salePrice: number;
  costPriceSnapshot: number;
  adPercentSnapshot: number;
  vatPercentSnapshot: number;
  revenue: number;
  cost: number;
  adSpend: number;
  vat: number;
  grossProfit: number;
  profitMarginPercent: number;
  notes?: string;
  closedAt?: string;
  stageHistory?: DealStageHistory[];
  followUps?: FollowUp[];
  createdAt: string;
  updatedAt: string;
}

export interface DealStageHistory {
  id: string;
  dealId: string;
  fromStageId?: string;
  fromStage?: PipelineStage;
  toStageId: string;
  toStage?: PipelineStage;
  changedById?: string;
  changedBy?: User;
  changedAt: string;
  notes?: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  recipients?: CampaignRecipient[];
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  createdById?: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  email: string;
  name?: string;
  opened: boolean;
  openedAt?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  userId?: string;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  dealId?: string;
  deal?: { id: string; title: string };
  supplierId?: string;
  supplier?: { id: string; name: string };
  note?: string;
  dueAt: string;
  isCompleted: boolean;
  assignedUserId?: string;
  assignedUser?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  description?: string;
  userId?: string;
  user?: User;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardAnalytics {
  monthlyRevenue: number;
  monthlyProfit: number;
  openDealsCount: number;
  vatCollected: number;
  dealsByStage: { stage: string; count: number; value: number }[];
  profitOverTime: { month: string; profit: number; revenue: number }[];
  upcomingFollowUps: FollowUp[];
}

// ─── Marketing & LinkedIn ─────────────────────────────────────────────────────

export type MarketingCampaignType = 'LINKEDIN' | 'EMAIL' | 'COMBINED';
export type MarketingCampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
export type LinkedInConnectionStatus = 'PENDING' | 'CONNECTED' | 'DECLINED';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'RESPONDED' | 'QUALIFIED' | 'CONVERTED';
export type OutreachEmailStatus = 'DRAFT' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'REPLIED' | 'BOUNCED';

export interface LinkedInAccount {
  id: string;
  email: string;
  name?: string;
  profileUrl?: string;
  isActive: boolean;
  lastSyncAt?: string;
  _count?: { connections: number; messages: number };
  createdAt: string;
  updatedAt: string;
}

export interface LinkedInConnection {
  id: string;
  accountId: string;
  account?: { id: string; email: string; name?: string };
  profileUrl: string;
  name: string;
  headline?: string;
  company?: string;
  location?: string;
  status: LinkedInConnectionStatus;
  connectedAt?: string;
  campaignId?: string;
  campaign?: { id: string; name: string };
  messages?: LinkedInMessage[];
  _count?: { messages: number };
  createdAt: string;
  updatedAt: string;
}

export interface LinkedInMessage {
  id: string;
  accountId: string;
  connectionId?: string;
  threadId?: string;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  isRead: boolean;
  isAiGenerated: boolean;
  sentAt: string;
  createdAt: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  description?: string;
  type: MarketingCampaignType;
  status: MarketingCampaignStatus;
  targetCriteria?: {
    keywords?: string;
    industry?: string;
    location?: string;
    companySize?: string;
    jobTitle?: string;
  };
  aiPrompt?: string;
  productIds?: string[];
  createdById: string;
  createdBy?: { id: string; name: string; email: string };
  startedAt?: string;
  completedAt?: string;
  _count?: { connections: number; leads: number; outreachEmails: number };
  createdAt: string;
  updatedAt: string;
}

export interface MarketingLead {
  id: string;
  campaignId?: string;
  campaign?: { id: string; name: string };
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  industry?: string;
  source?: string;
  notes?: string;
  status: LeadStatus;
  _count?: { outreachEmails: number };
  createdAt: string;
  updatedAt: string;
}

export interface OutreachEmail {
  id: string;
  campaignId?: string;
  campaign?: { id: string; name: string };
  leadId?: string;
  lead?: { id: string; companyName: string; contactName?: string };
  toEmail: string;
  toName?: string;
  subject: string;
  body: string;
  status: OutreachEmailStatus;
  isAiGenerated: boolean;
  sentAt?: string;
  openedAt?: string;
  repliedAt?: string;
  replyContent?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Grok AI ──────────────────────────────────────────────────────────────────

export interface AISettings {
  id: string;
  provider: string;
  apiKey: string;
  model: string;
  isActive: boolean;
  defaultPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIConversation {
  id: string;
  context: string;
  entityType?: string;
  entityId?: string;
  prompt: string;
  response: string;
  tokensUsed?: number;
  createdAt: string;
}

export interface MarketingStats {
  total: number;
  active: number;
  totalLeads: number;
  emailsSent: number;
  byStatus: { status: string; _count: number }[];
}
