import { Command } from "commander";
import inquirer from "inquirer";
import { ConfigManager } from "../utils/config";
import { ChromeWebStoreConfig, ConfigureCommandOptions } from "../types";
import { Logger } from "../utils/logger";

// Helper function to check if interactive mode is needed
function shouldUseInteractiveMode(options: ConfigureCommandOptions): boolean {
  return (
    options.interactive ||
    !options.clientId ||
    !options.clientSecret ||
    !options.refreshToken ||
    !options.publisherId
  );
}

// Helper function to show configuration instructions
function showConfigurationInstructions(): void {
  Logger.blue("🔧 CWS CLI Configuration");
  Logger.gray("Please provide your Chrome Web Store API credentials.\n");

  Logger.yellow("💡 How to get these credentials:");
  Logger.gray(
    "1. Go to the Google Cloud Console (https://console.cloud.google.com)"
  );
  Logger.gray("2. Enable the Chrome Web Store API");
  Logger.gray("3. Create OAuth2 credentials");
  Logger.gray(
    "4. Get your Publisher ID from the Chrome Web Store Developer Dashboard\n"
  );
}

// Helper function to get interactive configuration
async function getInteractiveConfig(): Promise<ChromeWebStoreConfig> {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "clientId",
      message: "Google OAuth2 Client ID:",
      validate: (input) => input.trim().length > 0 || "Client ID is required",
    },
    {
      type: "password",
      name: "clientSecret",
      message: "Google OAuth2 Client Secret:",
      mask: "*",
      validate: (input) =>
        input.trim().length > 0 || "Client Secret is required",
    },
    {
      type: "password",
      name: "refreshToken",
      message: "OAuth2 Refresh Token:",
      mask: "*",
      validate: (input) =>
        input.trim().length > 0 || "Refresh Token is required",
    },
    {
      type: "input",
      name: "publisherId",
      message: "Chrome Web Store Publisher ID:",
      validate: (input) =>
        input.trim().length > 0 || "Publisher ID is required",
    },
  ]);

  return {
    clientId: answers.clientId.trim(),
    clientSecret: answers.clientSecret.trim(),
    refreshToken: answers.refreshToken.trim(),
    publisherId: answers.publisherId.trim(),
  };
}

// Helper function to get config from command line options
function getConfigFromOptions(
  options: ConfigureCommandOptions
): ChromeWebStoreConfig {
  return {
    clientId: options.clientId!,
    clientSecret: options.clientSecret!,
    refreshToken: options.refreshToken!,
    publisherId: options.publisherId!,
  };
}

export const configureCommand = new Command("configure")
  .description("Configure Chrome Web Store API credentials")
  .option("-i, --interactive", "force interactive configuration mode")
  .option("--client-id <id>", "Google OAuth2 client ID")
  .option("--client-secret <secret>", "Google OAuth2 client secret")
  .option("--refresh-token <token>", "OAuth2 refresh token")
  .option("--publisher-id <id>", "Chrome Web Store publisher ID")
  .action(async (options: ConfigureCommandOptions, command: Command) => {
    const globalOptions = command.parent?.opts() || {};

    try {
      Logger.setVerbose(globalOptions.verbose || false);

      let config: ChromeWebStoreConfig;

      if (shouldUseInteractiveMode(options)) {
        showConfigurationInstructions();
        config = await getInteractiveConfig();
      } else {
        config = getConfigFromOptions(options);
      }

      await ConfigManager.saveConfig(config, globalOptions.config);

      Logger.green("✅ Configuration saved successfully!");
      Logger.gray(
        `Config saved to: ${globalOptions.config || "~/.cws-manager-cli/config.json"}`
      );
    } catch (error) {
      Logger.red(
        "❌ Configuration failed:",
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });
