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
  | 'CUSTOMER_ORDER'
  | 'SYSTEM';

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  title?: string;
  department?: string;
  isActive?: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  baseDomainUrl?: string;
  logoUrl?: string;
  primaryColor: string;
  currency: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  vatNumber?: string;
  companyRegNumber?: string;
  defaultVatPercent: number;
  defaultAdPercent: number;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
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
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  country?: string;
  rating?: number;
  salesPersonId?: string;
  salesPerson?: { id: string; name: string; email: string };
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

export interface Courier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  trackingUrl?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contactName?: string;
  email: string;
  phone?: string;
  notes?: string;
  categoryIds?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrder {
  id: string;
  customerId: string;
  customer?: Customer;
  productId?: string;
  productName: string;
  quantity: number;
  deliveryLocation?: string;
  courierId?: string;
  courier?: Courier;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BulkPricing {
  id: string;
  productId: string;
  minQuantity: number;
  bulkCostPrice: number;
  discountType?: string;
  discountValue?: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  imageUrl?: string;
  baseCostPrice: number;
  retailPrice?: number;
  vatPercent?: number;
  adPercent?: number;
  categoryId?: string;
  category?: ProductCategory;
  supplierId?: string;
  supplier?: Supplier;
  bulkPricings?: BulkPricing[];
  minOrderQuantity?: number;
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
  courierId?: string;
  courier?: Courier;
  shippingCost?: number;
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
  password?: string;
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
  pipelineStageId?: string;
  pipelineStage?: { id: string; name: string; color?: string };
  productId?: string;
  product?: { id: string; name: string; sku: string };
  categoryId?: string;
  category?: { id: string; name: string };
  companyName?: string;
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

// ─── Procurement Intelligence ─────────────────────────────────────────────────

export interface ProcurementIntelligence {
  overview: {
    totalSuppliers: number;
    activeSuppliers: number;
    totalProducts: number;
    totalCategories: number;
    totalLeads: number;
    pipelineValue: number;
    winRate: number;
    avgDealSize: number;
  };
  leadFunnel: { status: string; count: number }[];
  topSuppliers: {
    id: string;
    name: string;
    totalDeals: number;
    wonDeals: number;
    openDeals: number;
    productCount: number;
    totalRevenue: number;
    totalProfit: number;
    avgMargin: number;
  }[];
  categoryDemand: {
    id: string;
    name: string;
    productCount: number;
    totalDealCount: number;
    wonRevenue: number;
  }[];
  campaignPerformance: {
    id: string;
    name: string;
    type: string;
    status: string;
    leadsGenerated: number;
    connections: number;
    emailsSent: number;
    startedAt: string | null;
    createdAt: string;
  }[];
  recentLeads: {
    id: string;
    companyName: string;
    contactName: string | null;
    contactEmail: string | null;
    industry: string | null;
    source: string | null;
    status: string;
    campaignName: string | null;
    createdAt: string;
  }[];
  outreachPerformance: Record<string, number>;
}

export interface SupplierMarginData {
  supplierId: string;
  supplierName: string;
  wonDeals: number;
  totalRevenue: number;
  totalGrossProfit: number;
  avgProfitMarginPercent: number;
}

// ─── CCS Framework Types ──────────────────────────────────────────────────────

export type CcsFrameworkStatus = 'LIVE' | 'EXPIRED' | 'UPCOMING';
export type CcsOpportunityStatus = 'OPEN' | 'CLOSED' | 'AWARDED' | 'CANCELLED';
export type CcsBidStatus = 'NOT_BIDDING' | 'PREPARING' | 'SUBMITTED' | 'WON' | 'LOST';

export interface CcsFramework {
  id: string;
  reference: string;
  title: string;
  description?: string;
  category: string;
  status: CcsFrameworkStatus;
  startDate?: string;
  endDate?: string;
  websiteUrl?: string;
  maxValue?: number;
  lots?: CcsLot[];
  opportunities?: CcsOpportunity[];
  _count?: { lots: number; opportunities: number };
  createdAt: string;
  updatedAt: string;
}

export interface CcsLot {
  id: string;
  frameworkId: string;
  framework?: { id: string; reference: string; title: string };
  lotNumber: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CcsOpportunity {
  id: string;
  frameworkId?: string;
  framework?: { id: string; reference: string; title: string; category?: string };
  title: string;
  description?: string;
  buyerName?: string;
  status: CcsOpportunityStatus;
  publishedDate?: string;
  closingDate?: string;
  value?: number;
  region?: string;
  category?: string;
  noticeUrl?: string;
  notes?: string;
  bidStatus: CcsBidStatus;
  bidDeadline?: string;
  bidValue?: number;
  assignedUserId?: string;
  assignedUser?: { id: string; name: string; email?: string };
  createdAt: string;
  updatedAt: string;
}

export interface CcsStats {
  frameworks: { total: number; live: number; expired: number; upcoming: number };
  opportunities: { total: number; open: number; bidding: number };
}
