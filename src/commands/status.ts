import { Command } from "commander";
import chalk from "chalk";
import { ConfigManager } from "../utils/config";
import { ChromeWebStoreClient } from "../services/chrome-webstore-client";
import {
  CommandOptions,
  ItemState,
  UploadState,
  StatusCommandOptions,
} from "../types";
import { withSpinnerCustom } from "../utils/spinner";

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
        console.log(chalk.blue("📊 Chrome Web Store Status"));
        console.log(chalk.gray(`Item ID: ${itemId}\n`));

        // Load configuration
        const config = await ConfigManager.loadConfig(opts.config);
        const client = new ChromeWebStoreClient(config);

        const fetchStatus = async () => {
          return await withSpinnerCustom(
            "Fetching status...",
            async (spinner) => {
              try {
                const response = await client.fetchItemStatus(itemId);
                spinner.stop();

                // Display status information
                console.log(chalk.green("📋 Status Information:"));

                if (response.itemId) {
                  console.log(chalk.gray(`  Item ID: ${response.itemId}`));
                }

                if (response.publicKey) {
                  console.log(
                    chalk.gray(
                      `  Public Key: ${response.publicKey.substring(0, 20)}...`
                    )
                  );
                }

                // Published status
                if (response.publishedItemRevisionStatus) {
                  console.log(chalk.green("\n📦 Published Version:"));
                  console.log(
                    chalk.gray(
                      `  State: ${getStateColor(
                        response.publishedItemRevisionStatus.state
                      )}`
                    )
                  );

                  if (
                    response.publishedItemRevisionStatus.distributionChannels
                  ) {
                    response.publishedItemRevisionStatus.distributionChannels.forEach(
                      (channel, index) => {
                        console.log(chalk.gray(`  Channel ${index + 1}:`));
                        if (channel.crxVersion) {
                          console.log(
                            chalk.gray(`    Version: ${channel.crxVersion}`)
                          );
                        }
                        if (channel.deployPercentage !== undefined) {
                          console.log(
                            chalk.gray(
                              `    Deploy %: ${channel.deployPercentage}%`
                            )
                          );
                        }
                      }
                    );
                  }
                }

                // Submitted status
                if (response.submittedItemRevisionStatus) {
                  console.log(chalk.yellow("\n🔄 Submitted Version:"));
                  console.log(
                    chalk.gray(
                      `  State: ${getStateColor(
                        response.submittedItemRevisionStatus.state
                      )}`
                    )
                  );

                  if (
                    response.submittedItemRevisionStatus.distributionChannels
                  ) {
                    response.submittedItemRevisionStatus.distributionChannels.forEach(
                      (channel, index) => {
                        console.log(chalk.gray(`  Channel ${index + 1}:`));
                        if (channel.crxVersion) {
                          console.log(
                            chalk.gray(`    Version: ${channel.crxVersion}`)
                          );
                        }
                        if (channel.deployPercentage !== undefined) {
                          console.log(
                            chalk.gray(
                              `    Deploy %: ${channel.deployPercentage}%`
                            )
                          );
                        }
                      }
                    );
                  }
                }

                // Upload status
                if (response.lastAsyncUploadState) {
                  console.log(chalk.blue("\n📤 Last Upload:"));
                  console.log(
                    chalk.gray(
                      `  State: ${getUploadStateColor(
                        response.lastAsyncUploadState
                      )}`
                    )
                  );
                }

                // Warnings and takedowns
                if (response.warned) {
                  console.log(
                    chalk.yellow(
                      "\n⚠️  Warning: Item has policy violation warnings"
                    )
                  );
                }

                if (response.takenDown) {
                  console.log(
                    chalk.red(
                      "\n❌ Item has been taken down for policy violations"
                    )
                  );
                }

                if (opts.verbose) {
                  console.log(
                    chalk.gray("\nRaw response:"),
                    JSON.stringify(response, null, 2)
                  );
                }

                return response;
              } catch (error) {
                spinner.fail("Failed to fetch status");
                throw error;
              }
            }
          );
        };

        // Initial fetch
        await fetchStatus();

        // Watch mode
        if (opts.watch) {
          const interval = parseInt(opts.interval || "30", 10);

          if (isNaN(interval) || interval < 5) {
            throw new Error("Interval must be at least 5 seconds");
          }

          console.log(
            chalk.blue(
              `\n👁️  Watching for changes (polling every ${interval} seconds)...`
            )
          );
          console.log(chalk.gray("Press Ctrl+C to stop watching\n"));

          setInterval(async () => {
            try {
              console.log(
                chalk.gray(
                  `[${new Date().toLocaleTimeString()}] Checking status...`
                )
              );
              await fetchStatus();
              console.log("");
            } catch (error) {
              console.error(
                chalk.red("Status check failed:"),
                error instanceof Error ? error.message : error
              );
            }
          }, interval * 1000);
        }
      } catch (error) {
        console.error(
          chalk.red("❌ Status check failed:"),
          error instanceof Error ? error.message : error
        );
        process.exit(1);
      }
    }
  );

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
