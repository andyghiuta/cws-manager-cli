import { Command } from "commander";
import chalk from "chalk";
import { ConfigManager } from "../utils/config";
import { ChromeWebStoreClient } from "../services/chrome-webstore-client";
import {
  CommandOptions,
  ItemState,
  UploadState,
  StatusCommandOptions,
  FetchItemStatusResponse,
  DistributionChannel,
} from "../types";
import { withSpinnerCustom } from "../utils/spinner";
import { Logger } from "../utils/logger";

// Helper function to display status response
async function displayStatusResponse(
  response: FetchItemStatusResponse
): Promise<void> {
  // Display status information
  Logger.blue("📋 Status Information:");

  if (response.itemId) {
    Logger.verbose(`  Item ID: ${response.itemId}`);
  }

  if (response.publicKey) {
    Logger.verbose(`  Public Key: ${response.publicKey.substring(0, 20)}...`);
  }

  // Published status
  if (response.publishedItemRevisionStatus) {
    Logger.green("\n📦 Published Version:");
    console.log(
      `  State: ${getStateColor(response.publishedItemRevisionStatus.state)}`
    );

    if (response.publishedItemRevisionStatus.distributionChannels) {
      displayDistributionChannels(
        response.publishedItemRevisionStatus.distributionChannels
      );
    }
  }

  // Submitted status
  if (response.submittedItemRevisionStatus) {
    Logger.yellow("\n🔄 Submitted Version:");
    console.log(
      `  State: ${getStateColor(response.submittedItemRevisionStatus.state)}`
    );

    if (response.submittedItemRevisionStatus.distributionChannels) {
      displayDistributionChannels(
        response.submittedItemRevisionStatus.distributionChannels
      );
    }
  }

  // Upload status
  if (response.lastAsyncUploadState) {
    Logger.blue("\n📤 Last Upload:");
    console.log(
      `  State: ${getUploadStateColor(response.lastAsyncUploadState)}`
    );
  }

  // Warnings and takedowns
  if (response.warned) {
    Logger.yellow("\n⚠️  Warning: Item has policy violation warnings");
  }

  if (response.takenDown) {
    Logger.red("\n❌ Item has been taken down for policy violations");
  }
}

// Helper function to display distribution channels
function displayDistributionChannels(channels: DistributionChannel[]): void {
  channels.forEach((channel, index) => {
    Logger.gray(`  Channel ${index + 1}:`);
    if (channel.crxVersion) {
      Logger.gray(`    Version: ${channel.crxVersion}`);
    }
    if (channel.deployPercentage !== undefined) {
      Logger.gray(`    Deploy %: ${channel.deployPercentage}%`);
    }
  });
}

// Helper function to create fetchStatus function
function createFetchStatusFunction(
  client: ChromeWebStoreClient,
  itemId: string,
  opts: CommandOptions & { verbose?: boolean }
) {
  return async () => {
    return await withSpinnerCustom("Fetching status...", async (spinner) => {
      try {
        const response = await client.fetchItemStatus(itemId);
        spinner.stop();

        await displayStatusResponse(response);

        if (opts.verbose) {
          Logger.verbose("\nRaw response:", JSON.stringify(response, null, 2));
        }

        return response;
      } catch (error) {
        spinner.fail("Failed to fetch status");
        throw error;
      }
    });
  };
}

// Helper function to setup watch mode
function setupWatchMode(
  fetchStatus: () => Promise<FetchItemStatusResponse>,
  opts: { interval?: string }
): void {
  const interval = parseInt(opts.interval || "30", 10);

  if (isNaN(interval) || interval < 5) {
    throw new Error("Interval must be at least 5 seconds");
  }

  Logger.blue(
    `\n👁️  Watching for changes (polling every ${interval} seconds)...`
  );
  Logger.verbose("Press Ctrl+C to stop watching\n");

  setInterval(async () => {
    try {
      Logger.verbose(`[${new Date().toLocaleTimeString()}] Checking status...`);
      await fetchStatus();
      console.log("");
    } catch (error) {
      Logger.red(
        "Status check failed:",
        error instanceof Error ? error.message : error
      );
    }
  }, interval * 1000);
}

function getStateColor(state?: ItemState): string {
  if (!state) return "Unknown";

  switch (state) {
    case ItemState.PUBLISHED:
      return chalk.green(state);
    case ItemState.PUBLISHED_TO_TESTERS:
      return chalk.blue(state);
    case ItemState.PENDING_REVIEW:
      return chalk.yellow(state);
    case ItemState.STAGED:
      return chalk.cyan(state);
    case ItemState.REJECTED:
      return chalk.red(state);
    case ItemState.CANCELLED:
      return chalk.gray(state);
    default:
      return chalk.gray(state);
  }
}

function getUploadStateColor(state?: UploadState): string {
  if (!state) return "Unknown";

  switch (state) {
    case UploadState.SUCCEEDED:
      return chalk.green(state);
    case UploadState.IN_PROGRESS:
      return chalk.yellow(state);
    case UploadState.FAILED:
      return chalk.red(state);
    default:
      return chalk.gray(state);
  }
}

export const statusCommand = new Command("status")
  .description("Get the status of an item in the Chrome Web Store")
  .argument("<item-id>", "Chrome Web Store item (extension) ID")
  .option("-w, --watch", "Watch for status changes (polls every 30 seconds)")
  .option(
    "-i, --interval <seconds>",
    "Poll interval in seconds when watching",
    "30"
  )
  .action(
    async (itemId: string, options: StatusCommandOptions, command: Command) => {
      const globalOptions = command.parent?.opts() || {};
      const opts: CommandOptions & { watch?: boolean; interval?: string } = {
        ...globalOptions,
        itemId,
        ...options,
      };

      try {
        Logger.setVerbose(opts.verbose || false);
        Logger.blue("📊 Chrome Web Store Status");
        Logger.gray(`Item ID: ${itemId}\n`);

        // Load configuration
        const config = await ConfigManager.loadConfig(opts.config);
        const client = new ChromeWebStoreClient(config);

        // Create fetch status function
        const fetchStatus = createFetchStatusFunction(client, itemId, opts);

        // Initial fetch
        await fetchStatus();

        // Watch mode
        if (opts.watch) {
          setupWatchMode(fetchStatus, opts);
        }
      } catch (error) {
        Logger.red(
          "❌ Status check failed:",
          error instanceof Error ? error.message : error
        );
        process.exit(1);
      }
    }
  );
