import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { ConfigManager } from "../utils/config";
import { ChromeWebStoreClient } from "../services/chrome-webstore-client";
import { PublishOptions, PublishType } from "../types";

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
  .action(async (itemId: string, options: any, command: Command) => {
    const globalOptions = command.parent?.opts() || {};
    const opts: PublishOptions = { ...globalOptions, itemId, ...options };

    try {
      console.log(chalk.blue("🚀 Chrome Web Store Publish"));
      console.log(chalk.gray(`Item ID: ${itemId}`));

      if (opts.dry) {
        console.log(
          chalk.yellow("🏃 Dry run mode - no actual publish will be performed")
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
        throw new Error("Deploy percentage must be a number between 0 and 100");
      }

      const spinner = ora("Publishing item...").start();

      try {
        const response = await client.publishItem(itemId, {
          skipReview: opts.skipReview,
          publishType,
          deployInfos:
            deployPercentage < 100 ? [{ deployPercentage }] : undefined,
        });

        spinner.succeed("Item published successfully");

        if (opts.verbose) {
          console.log(chalk.gray("Publish response:"), response);
        }

        console.log(chalk.green("✅ Publish completed!"));
        console.log(chalk.gray(`Status: ${response.state}`));

        if (response.itemId) {
          console.log(chalk.gray(`Item ID: ${response.itemId}`));
        }
      } catch (error) {
        spinner.fail("Publish failed");
        throw error;
      }
    } catch (error) {
      console.error(
        chalk.red("❌ Publish failed:"),
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });
