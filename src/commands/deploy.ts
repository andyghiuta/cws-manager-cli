import { Command } from "commander";
import chalk from "chalk";
import { ConfigManager } from "../utils/config";
import { ChromeWebStoreClient } from "../services/chrome-webstore-client";
import { DeployPercentageOptions } from "../types";
import { withSpinner } from "../utils/spinner";

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
      const opts: DeployPercentageOptions = {
        ...globalOptions,
        itemId,
        percentage: parseInt(percentage, 10),
      };

      try {
        console.log(chalk.blue("🎯 Chrome Web Store Deploy Percentage"));
        console.log(chalk.gray(`Item ID: ${itemId}`));
        console.log(chalk.gray(`Deploy Percentage: ${opts.percentage}%`));

        if (
          isNaN(opts.percentage) ||
          opts.percentage < 0 ||
          opts.percentage > 100
        ) {
          throw new Error(
            "Deploy percentage must be a number between 0 and 100"
          );
        }

        if (opts.dry) {
          console.log(
            chalk.yellow(
              "🏃 Dry run mode - no actual deployment change will be performed"
            )
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

        console.log(chalk.green("✅ Deploy percentage updated!"));
        console.log(
          chalk.gray(
            `The published revision will now be deployed to ${opts.percentage}% of users.`
          )
        );

        if (opts.verbose) {
          console.log(
            chalk.gray(
              "Note: Changes may take some time to propagate to all users."
            )
          );
        }
      } catch (error) {
        console.error(
          chalk.red("❌ Deploy percentage update failed:"),
          error instanceof Error ? error.message : error
        );
        process.exit(1);
      }
    }
  );
