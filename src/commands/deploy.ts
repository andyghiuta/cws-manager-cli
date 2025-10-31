import { Command } from "commander";
import { ConfigManager } from "../utils/config";
import { ChromeWebStoreClient } from "../services/chrome-webstore-client";
import { DeployPercentageOptions } from "../types";
import { withSpinner } from "../utils/spinner";
import { Logger } from "../utils/logger";

// Helper function to validate deploy percentage
function validatePercentage(percentage: string): number {
  const deployPercentage = parseInt(percentage, 10);

  if (
    isNaN(deployPercentage) ||
    deployPercentage < 0 ||
    deployPercentage > 100
  ) {
    throw new Error("Deploy percentage must be a number between 0 and 100");
  }

  return deployPercentage;
}

export const deployCommand = new Command("deploy")
  .description("Set the deployment percentage for a published item")
  .argument("<item-id>", "Chrome Web Store item (extension) ID")
  .argument("<percentage>", "Deployment percentage (0-100)")
  .action(
    async (
      itemId: string,
      percentage: string,
      _options: unknown,
      command: Command
    ) => {
      const globalOptions = command.parent?.opts() || {};
      const deployPercentage = validatePercentage(percentage);

      const opts: DeployPercentageOptions = {
        ...globalOptions,
        itemId,
        percentage: deployPercentage,
      };

      try {
        Logger.blue("🎯 Chrome Web Store Deploy Percentage");
        Logger.verbose(`Item ID: ${itemId}`);
        Logger.verbose(`Deploy Percentage: ${opts.percentage}%`);

        if (opts.dry) {
          Logger.yellow(
            "🏃 Dry run mode - no actual deployment change will be performed"
          );
          return;
        }

        // Load configuration
        const config = await ConfigManager.loadConfig(opts.config);
        const client = new ChromeWebStoreClient(config);

        await withSpinner(
          "Updating deployment percentage...",
          "Deployment percentage updated successfully",
          "Deploy percentage update failed",
          () =>
            client.setPublishedDeployPercentage(itemId, {
              deployPercentage: opts.percentage,
            })
        );

        Logger.green("✅ Deploy percentage updated!");
        Logger.verbose(
          `Visit https://chrome.google.com/webstore/devconsole to manage your rollout`
        );

        if (opts.verbose) {
          Logger.verbose(`Deploy percentage set to ${opts.percentage}%`);
        }
      } catch (error) {
        Logger.red(
          "❌ Deploy percentage update failed:",
          error instanceof Error ? error.message : error
        );
        process.exit(1);
      }
    }
  );
