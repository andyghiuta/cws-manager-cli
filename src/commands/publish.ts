import { Command } from "commander";
import { ConfigManager } from "../utils/config";
import { ChromeWebStoreClient } from "../services/chrome-webstore-client";
import { PublishOptions, PublishType, PublishCommandOptions } from "../types";
import { withSpinner } from "../utils/spinner";
import { Logger } from "../utils/logger";

export const publishCommand = new Command("publish")
  .description("Publish an item in the Chrome Web Store")
  .argument("<item-id>", "Chrome Web Store item (extension) ID")
  .option("-s, --skip-review", "Skip review process if possible")
  .option(
    "-p, --publish-type <type>",
    "Publish type: default, staged",
    "default"
  )
  .option(
    "-d, --deploy-percentage <percentage>",
    "Initial deploy percentage (0-100)",
    "100"
  )
  .action(
    async (
      itemId: string,
      options: PublishCommandOptions,
      command: Command
    ) => {
      const globalOptions = command.parent?.opts() || {};
      const opts: PublishOptions = { ...globalOptions, itemId, ...options };

      try {
        Logger.setVerbose(opts.verbose || false);
        Logger.blue("🚀 Chrome Web Store Publish");
        Logger.verbose(`Item ID: ${itemId}`);

        if (opts.dry) {
          Logger.yellow(
            "🏃 Dry run mode - no actual publish will be performed"
          );
          return;
        }

        // Load configuration
        const config = await ConfigManager.loadConfig(opts.config);
        const client = new ChromeWebStoreClient(config);

        const publishType =
          opts.publishType === "staged"
            ? PublishType.STAGED_PUBLISH
            : PublishType.DEFAULT_PUBLISH;
        const deployPercentage = parseInt(opts.deployPercentage || "100", 10);

        if (
          isNaN(deployPercentage) ||
          deployPercentage < 0 ||
          deployPercentage > 100
        ) {
          throw new Error(
            "Deploy percentage must be a number between 0 and 100"
          );
        }

        const response = await withSpinner(
          "Publishing item...",
          "Item published successfully",
          "Publish failed",
          () =>
            client.publishItem(itemId, {
              skipReview: opts.skipReview,
              publishType,
              deployInfos:
                deployPercentage < 100 ? [{ deployPercentage }] : undefined,
            })
        );

        Logger.verbose("Publish response:", response);

        Logger.green("✅ Publish completed!");
        Logger.gray(`Status: ${response.state}`);

        if (response.itemId) {
          Logger.gray(`Item ID: ${response.itemId}`);
        }
      } catch (error) {
        Logger.red(
          "❌ Publish failed:",
          error instanceof Error ? error.message : error
        );
        process.exit(1);
      }
    }
  );
