import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname, extname } from "path";
import { homedir } from "os";
import { ChromeWebStoreConfig } from "../types";

export class ConfigManager {
  private static readonly CONFIG_DIR = join(homedir(), ".cws-cli");
  private static readonly CONFIG_FILE = join(
    ConfigManager.CONFIG_DIR,
    "config.json"
  );

  static async loadConfig(configPath?: string): Promise<ChromeWebStoreConfig> {
    const filePath = configPath || ConfigManager.CONFIG_FILE;

    if (!existsSync(filePath)) {
      throw new Error(
        `Config file not found: ${filePath}\nRun 'cws configure' to create one.`
      );
    }

    try {
      const configData = readFileSync(filePath, "utf8");
      const config = JSON.parse(configData) as ChromeWebStoreConfig;

      ConfigManager.validateConfig(config);
      return config;
    } catch (error) {
      throw new Error(`Failed to load config: ${error}`);
    }
  }

  static async saveConfig(
    config: ChromeWebStoreConfig,
    configPath?: string
  ): Promise<void> {
    const filePath = configPath || ConfigManager.CONFIG_FILE;
    const configDir = dirname(filePath);

    // Ensure config directory exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    try {
      ConfigManager.validateConfig(config);
      const configData = JSON.stringify(config, null, 2);
      writeFileSync(filePath, configData, "utf8");
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  static validateConfig(config: ChromeWebStoreConfig): void {
    const requiredFields = [
      "clientId",
      "clientSecret",
      "refreshToken",
      "publisherId",
    ];
    const missingFields = requiredFields.filter(
      (field) => !config[field as keyof ChromeWebStoreConfig]
    );

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required config fields: ${missingFields.join(", ")}`
      );
    }
  }

  static getExampleConfig(): ChromeWebStoreConfig {
    return {
      clientId: "your-google-client-id.apps.googleusercontent.com",
      clientSecret: "your-client-secret",
      refreshToken: "your-refresh-token",
      publisherId: "your-publisher-id",
    };
  }
}

export function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    case ".zip":
      return "application/zip";
    case ".crx":
      return "application/x-chrome-extension";
    default:
      return "application/octet-stream";
  }
}

export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

export function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
