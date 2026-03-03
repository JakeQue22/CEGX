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
  contactName?: string;
  email?: string;
  phone?: string;
  country?: string;
  rating?: number;
  notes?: string;
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
  maxQuantity?: number;
  unitCost: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  baseCost: number;
  categoryId?: string;
  category?: ProductCategory;
  supplierId?: string;
  supplier?: Supplier;
  bulkPricing?: BulkPricing[];
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
  quantity: number;
  costPrice: number;
  salePrice: number;
  adSpend: number;
  vatPercent: number;
  adPercent: number;
  revenue: number;
  cost: number;
  grossProfit: number;
  netProfit: number;
  vatAmount: number;
  marginPercent: number;
  notes?: string;
  assignedToId?: string;
  assignedTo?: User;
  expectedCloseDate?: string;
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
  dealId: string;
  deal?: Deal;
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string;
  assignedToId?: string;
  assignedTo?: User;
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
