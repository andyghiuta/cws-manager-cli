import { Command } from "commander";
import { ConfigManager } from "../utils/config";
import { ChromeWebStoreClient } from "../services/chrome-webstore-client";
import { CommandOptions } from "../types";
import { withSpinner } from "../utils/spinner";
import { Logger } from "../utils/logger";

export const cancelCommand = new Command("cancel")
  .description("Cancel the current submission of an item")
  .argument("<item-id>", "Chrome Web Store item (extension) ID")
  .action(async (itemId: string, _options: unknown, command: Command) => {
    const globalOptions = command.parent?.opts() || {};
    const opts: CommandOptions = { ...globalOptions, itemId };

    try {
      Logger.setVerbose(opts.verbose || false);
      Logger.blue("❌ Chrome Web Store Cancel Submission");
      Logger.gray(`Item ID: ${itemId}`);

      if (opts.dry) {
        Logger.yellow(
          "🏃 Dry run mode - no actual cancellation will be performed"
        );
        return;
      }

      // Load configuration
      const config = await ConfigManager.loadConfig(opts.config);
      const client = new ChromeWebStoreClient(config);

      await withSpinner(
        "Cancelling submission...",
        "Submission cancelled successfully",
        "Cancellation failed",
        () => client.cancelSubmission(itemId)
      );

      Logger.green("✅ Submission cancelled!");
      Logger.gray(
        "The current active submission has been cancelled and is no longer in review."
      );
    } catch (error) {
      Logger.red(
        "❌ Cancellation failed:",
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });
