import { readFileSync, existsSync } from "fs";
import { basename } from "path";
import {
  ChromeWebStoreConfig,
  UploadItemPackageResponse,
  PublishItemRequest,
  PublishItemResponse,
  FetchItemStatusResponse,
  SetPublishedDeployPercentageRequest,
  UploadState,
} from "../types";

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class ChromeWebStoreClient {
  private static readonly BASE_URL = "https://chromewebstore.googleapis.com";
  private static readonly TOKEN_URL = "https://oauth2.googleapis.com/token";
  private static readonly POLL_INTERVAL_MS = 2000;
  private static readonly USER_AGENT = "cws-cli/1.0.0";

  private config: ChromeWebStoreConfig;
  private baseUrl = ChromeWebStoreClient.BASE_URL;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(config: ChromeWebStoreConfig) {
    this.config = config;
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Refresh the token
    const tokenData = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.config.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const response = await this.httpRequest<TokenResponse>(
      "POST",
      ChromeWebStoreClient.TOKEN_URL,
      {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      tokenData.toString()
    );

    this.accessToken = response.access_token;
    this.tokenExpiry = Date.now() + response.expires_in * 1000;

    return this.accessToken;
  }

  private async httpRequest<T>(
    method: string,
    requestUrl: string,
    headers: Record<string, string> = {},
    body?: string | Buffer
  ): Promise<T> {
    const response = await fetch(requestUrl, {
      method,
      headers: {
        ...headers,
        "User-Agent": ChromeWebStoreClient.USER_AGENT,
      },
      body: body || undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseText = await response.text();
    return responseText ? (JSON.parse(responseText) as T) : ({} as T);
  }

  private async makeRequest<T>(
    method: "GET" | "POST",
    apiPath: string,
    body?: any
  ): Promise<T> {
    const accessToken = await this.getAccessToken();
    const requestUrl = `${this.baseUrl}${apiPath}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };

    let requestBody: string | undefined;

    if (body) {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    }

    return this.httpRequest<T>(method, requestUrl, headers, requestBody);
  }

  async uploadPackage(
    itemId: string,
    filePath: string
  ): Promise<UploadItemPackageResponse> {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileBuffer = readFileSync(filePath);
    const boundary =
      "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const filename = basename(filePath);

    // Create multipart form data manually
    let body = "";
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
    body += `Content-Type: application/octet-stream\r\n`;
    body += `\r\n`;

    const bodyBuffer = Buffer.concat([
      Buffer.from(body),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const accessToken = await this.getAccessToken();
    const requestUrl = `${this.baseUrl}/upload/v2/publishers/${this.config.publisherId}/items/${itemId}:upload`;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": bodyBuffer.length.toString(),
    };

    return this.httpRequest<UploadItemPackageResponse>(
      "POST",
      requestUrl,
      headers,
      bodyBuffer
    );
  }

  async publishItem(
    itemId: string,
    request: PublishItemRequest
  ): Promise<PublishItemResponse> {
    const path = `/v2/publishers/${this.config.publisherId}/items/${itemId}:publish`;
    return this.makeRequest<PublishItemResponse>("POST", path, request);
  }

  async fetchItemStatus(itemId: string): Promise<FetchItemStatusResponse> {
    const path = `/v2/publishers/${this.config.publisherId}/items/${itemId}:fetchStatus`;
    return this.makeRequest<FetchItemStatusResponse>("GET", path);
  }

  async cancelSubmission(itemId: string): Promise<void> {
    const path = `/v2/publishers/${this.config.publisherId}/items/${itemId}:cancelSubmission`;
    await this.makeRequest<void>("POST", path, {});
  }

  async setPublishedDeployPercentage(
    itemId: string,
    request: SetPublishedDeployPercentageRequest
  ): Promise<void> {
    const path = `/v2/publishers/${this.config.publisherId}/items/${itemId}:setPublishedDeployPercentage`;
    await this.makeRequest<void>("POST", path, request);
  }

  async waitForUploadCompletion(
    itemId: string,
    maxWaitTime = 300000
  ): Promise<UploadState> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.fetchItemStatus(itemId);

      if (status.lastAsyncUploadState) {
        switch (status.lastAsyncUploadState) {
          case UploadState.SUCCEEDED:
            return UploadState.SUCCEEDED;
          case UploadState.FAILED:
            return UploadState.FAILED;
          case UploadState.IN_PROGRESS:
            // Continue waiting
            break;
          default:
            return status.lastAsyncUploadState;
        }
      }

      // Wait before checking again
      await new Promise<void>((resolve) =>
        setTimeout(resolve, ChromeWebStoreClient.POLL_INTERVAL_MS)
      );
    }

    throw new Error("Upload timeout: Maximum wait time exceeded");
  }
}
