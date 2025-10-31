import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { ChromeWebStoreConfig } from "../types";

/**
 * Manages Chrome Web Store CLI configuration.
 *
 * Configuration can be loaded from:
 * 1. A JSON config file (default: ~/.cws-manager-cli/config.json)
 * 2. Environment variables (as fallback when config file doesn't exist)
 *
 * Environment variables:
 * - CWS_CLIENT_ID: Google OAuth2 Client ID
 * - CWS_CLIENT_SECRET: Google OAuth2 Client Secret
 * - CWS_REFRESH_TOKEN: OAuth2 Refresh Token
 * - CWS_PUBLISHER_ID: Chrome Web Store Publisher ID
 */
export class ConfigManager {
  private static readonly CONFIG_DIR = join(homedir(), ".cws-manager-cli");
  private static readonly CONFIG_FILE = join(
    ConfigManager.CONFIG_DIR,
    "config.json"
  );

  // Environment variable names for configuration
  private static readonly ENV_VARS = {
    CLIENT_ID: "CWS_CLIENT_ID",
    CLIENT_SECRET: "CWS_CLIENT_SECRET",
    REFRESH_TOKEN: "CWS_REFRESH_TOKEN",
    PUBLISHER_ID: "CWS_PUBLISHER_ID",
  } as const;

  /**
   * Attempts to load configuration from environment variables
   */
  private static loadConfigFromEnv(): ChromeWebStoreConfig | null {
    const clientId = process.env[ConfigManager.ENV_VARS.CLIENT_ID];
    const clientSecret = process.env[ConfigManager.ENV_VARS.CLIENT_SECRET];
    const refreshToken = process.env[ConfigManager.ENV_VARS.REFRESH_TOKEN];
    const publisherId = process.env[ConfigManager.ENV_VARS.PUBLISHER_ID];

    // All environment variables must be present
    if (!clientId || !clientSecret || !refreshToken || !publisherId) {
      return null;
    }

    return {
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      refreshToken: refreshToken.trim(),
      publisherId: publisherId.trim(),
    };
  }

  /**
   * Checks if all required environment variables are set
   */
  static hasEnvConfig(): boolean {
    return ConfigManager.loadConfigFromEnv() !== null;
  }

  static async loadConfig(configPath?: string): Promise<ChromeWebStoreConfig> {
    const filePath = configPath || ConfigManager.CONFIG_FILE;

    // Try to load from file first
    if (existsSync(filePath)) {
      try {
        const configData = readFileSync(filePath, "utf8");
        const config = JSON.parse(configData) as ChromeWebStoreConfig;

        ConfigManager.validateConfig(config);
        return config;
      } catch (error) {
        throw new Error(`Failed to load config from file: ${error}`);
      }
    }

    // If file doesn't exist and no custom path specified, try environment variables
    if (!configPath) {
      const envConfig = ConfigManager.loadConfigFromEnv();
      if (envConfig) {
        ConfigManager.validateConfig(envConfig);
        return envConfig;
      }
    }

    // Neither file nor environment variables are available
    const envVarsList = Object.values(ConfigManager.ENV_VARS).join(", ");
    throw new Error(
      `Config file not found: ${filePath}\n` +
        `Alternative: Set environment variables (${envVarsList}) or run 'cws-manager configure' to create a config file.`
    );
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

  /**
   * Returns the environment variable names used for configuration
   */
  static getEnvVarNames(): typeof ConfigManager.ENV_VARS {
    return ConfigManager.ENV_VARS;
  }
}
