export interface DistributionChannel {
  crxVersion?: string;
  deployPercentage?: number;
}

export interface DeployInfo {
  deployPercentage: number;
}

export enum ItemState {
  ITEM_STATE_UNSPECIFIED = "ITEM_STATE_UNSPECIFIED",
  PENDING_REVIEW = "PENDING_REVIEW",
  STAGED = "STAGED",
  PUBLISHED = "PUBLISHED",
  PUBLISHED_TO_TESTERS = "PUBLISHED_TO_TESTERS",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum UploadState {
  UPLOAD_STATE_UNSPECIFIED = "UPLOAD_STATE_UNSPECIFIED",
  SUCCEEDED = "SUCCEEDED",
  IN_PROGRESS = "IN_PROGRESS",
  FAILED = "FAILED",
  NOT_FOUND = "NOT_FOUND",
}

export enum PublishType {
  PUBLISH_TYPE_UNSPECIFIED = "PUBLISH_TYPE_UNSPECIFIED",
  DEFAULT_PUBLISH = "DEFAULT_PUBLISH",
  STAGED_PUBLISH = "STAGED_PUBLISH",
}

export interface ItemRevisionStatus {
  state?: ItemState;
  distributionChannels?: DistributionChannel[];
}

export interface UploadItemPackageResponse {
  crxVersion?: string;
  name?: string;
  itemId?: string;
  uploadState?: UploadState;
}

export interface PublishItemRequest {
  skipReview?: boolean;
  publishType?: PublishType;
  deployInfos?: DeployInfo[];
}

export interface PublishItemResponse {
  state?: ItemState;
  name?: string;
  itemId?: string;
}

export interface SetPublishedDeployPercentageRequest {
  deployPercentage: number;
}

export interface FetchItemStatusResponse {
  submittedItemRevisionStatus?: ItemRevisionStatus;
  takenDown?: boolean;
  publishedItemRevisionStatus?: ItemRevisionStatus;
  publicKey?: string;
  name?: string;
  lastAsyncUploadState?: UploadState;
  itemId?: string;
  warned?: boolean;
}

export interface ChromeWebStoreConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  publisherId: string;
}

export interface CliOptions {
  config?: string;
  verbose?: boolean;
  dry?: boolean;
}

export interface CommandOptions extends CliOptions {
  itemId: string;
}

export interface UploadOptions extends CommandOptions {
  file: string;
  skipReview?: boolean;
  publishType?: string;
  deployPercentage?: string;
  autoPublish?: boolean;
  maxWaitTime?: string;
}

export interface PublishOptions extends CommandOptions {
  skipReview?: boolean;
  publishType?: string;
  deployPercentage?: string;
}

export interface DeployPercentageOptions extends CommandOptions {
  percentage: number;
}
