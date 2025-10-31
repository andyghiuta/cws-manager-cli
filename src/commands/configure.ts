import { Command } from "commander";
import inquirer from "inquirer";
import { ConfigManager } from "../utils/config";
import { ChromeWebStoreConfig, ConfigureCommandOptions } from "../types";
import { Logger } from "../utils/logger";

export const configureCommand = new Command("configure")
  .description("Configure Chrome Web Store API credentials")
  .option("-i, --interactive", "interactive configuration mode", true)
  .option("--client-id <id>", "Google OAuth2 client ID")
  .option("--client-secret <secret>", "Google OAuth2 client secret")
  .option("--refresh-token <token>", "OAuth2 refresh token")
  .option("--publisher-id <id>", "Chrome Web Store publisher ID")
  .action(async (options: ConfigureCommandOptions) => {
    try {
      let config: ChromeWebStoreConfig;

      if (
        options.interactive ||
        !options.clientId ||
        !options.clientSecret ||
        !options.refreshToken ||
        !options.publisherId
      ) {
        Logger.blue("🔧 CWS CLI Configuration");
        Logger.verbose(
          "Please provide your Chrome Web Store API credentials.\n"
        );

        Logger.yellow("💡 How to get these credentials:");
        Logger.verbose(
          "1. Go to the Google Cloud Console (https://console.cloud.google.com)"
        );
        Logger.verbose("2. Enable the Chrome Web Store API");
        Logger.verbose("3. Create OAuth2 credentials");
        Logger.verbose(
          "4. Get your Publisher ID from the Chrome Web Store Developer Dashboard\n"
        );

        const answers = await inquirer.prompt([
          {
            type: "input",
            name: "clientId",
            message: "Google OAuth2 Client ID:",
            validate: (input) =>
              input.trim().length > 0 || "Client ID is required",
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

        config = {
          clientId: answers.clientId.trim(),
          clientSecret: answers.clientSecret.trim(),
          refreshToken: answers.refreshToken.trim(),
          publisherId: answers.publisherId.trim(),
        };
      } else {
        config = {
          clientId: options.clientId,
          clientSecret: options.clientSecret,
          refreshToken: options.refreshToken,
          publisherId: options.publisherId,
        };
      }

      await ConfigManager.saveConfig(config, options.config);

      Logger.green("✅ Configuration saved successfully!");
      Logger.verbose(
        `Config saved to: ${options.config || "~/.cws-cli/config.json"}`
      );
    } catch (error) {
      Logger.red(
        "❌ Configuration failed:",
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });
