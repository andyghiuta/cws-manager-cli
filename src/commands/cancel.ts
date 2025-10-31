import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { ConfigManager } from "../utils/config";
import { ChromeWebStoreClient } from "../services/chrome-webstore-client";
import { CommandOptions } from "../types";

export const cancelCommand = new Command("cancel")
  .description("Cancel the current submission of an item")
  .argument("<item-id>", "Chrome Web Store item (extension) ID")
  .action(async (itemId: string, _options: any, command: Command) => {
    const globalOptions = command.parent?.opts() || {};
    const opts: CommandOptions = { ...globalOptions, itemId };

    try {
      console.log(chalk.blue("❌ Chrome Web Store Cancel Submission"));
      console.log(chalk.gray(`Item ID: ${itemId}`));

      if (opts.dry) {
        console.log(
          chalk.yellow(
            "🏃 Dry run mode - no actual cancellation will be performed"
          )
        );
        return;
      }

      // Load configuration
      const config = await ConfigManager.loadConfig(opts.config);
      const client = new ChromeWebStoreClient(config);

      const spinner = ora("Cancelling submission...").start();

      try {
        await client.cancelSubmission(itemId);
        spinner.succeed("Submission cancelled successfully");

        console.log(chalk.green("✅ Submission cancelled!"));
        console.log(
          chalk.gray(
            "The current active submission has been cancelled and is no longer in review."
          )
        );
      } catch (error) {
        spinner.fail("Cancellation failed");
        throw error;
      }
    } catch (error) {
      console.error(
        chalk.red("❌ Cancellation failed:"),
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });
