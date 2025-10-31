import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { existsSync, statSync } from "fs";
import { extname } from "path";
import { ConfigManager, formatFileSize } from "../utils/config";
import { ChromeWebStoreClient } from "../services/chrome-webstore-client";
import { UploadOptions, PublishType, UploadState } from "../types";

export const uploadCommand = new Command("upload")
  .description("Upload a package to Chrome Web Store")
  .argument("<item-id>", "Chrome Web Store item (extension) ID")
  .argument("<file>", "Path to the .zip or .crx file to upload")
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
  .option("-a, --auto-publish", "Automatically publish after successful upload")
  .option(
    "-w, --max-wait-time <seconds>",
    "Maximum time to wait for upload processing (in seconds)",
    "300"
  )
  .action(
    async (itemId: string, file: string, options: any, command: Command) => {
      const globalOptions = command.parent?.opts() || {};
      const opts: UploadOptions = {
        ...globalOptions,
        itemId,
        file,
        ...options,
      };

      try {
        // Validate file exists
        if (!existsSync(file)) {
          throw new Error(`File not found: ${file}`);
        }

        const fileStats = statSync(file);
        const fileExt = extname(file).toLowerCase();

        if (![".zip", ".crx"].includes(fileExt)) {
          throw new Error(
            `Unsupported file type: ${fileExt}. Only .zip and .crx files are supported.`
          );
        }

        console.log(chalk.blue("📦 Chrome Web Store Upload"));
        console.log(chalk.gray(`Item ID: ${itemId}`));
        console.log(
          chalk.gray(`File: ${file} (${formatFileSize(fileStats.size)})`)
        );

        if (opts.dry) {
          console.log(
            chalk.yellow("🏃 Dry run mode - no actual upload will be performed")
          );
          return;
        }

        // Load configuration
        const config = await ConfigManager.loadConfig(opts.config);
        const client = new ChromeWebStoreClient(config);

        // Upload the package
        const uploadSpinner = ora("Uploading package...").start();

        try {
          const uploadResponse = await client.uploadPackage(itemId, file);
          uploadSpinner.succeed("Package uploaded successfully");

          if (opts.verbose) {
            console.log(chalk.gray("Upload response:"), uploadResponse);
          }

          // Wait for upload processing if needed
          if (uploadResponse.uploadState === UploadState.IN_PROGRESS) {
            const maxWaitTime = parseInt(opts.maxWaitTime || "300", 10) * 1000; // Convert to milliseconds

            if (isNaN(maxWaitTime) || maxWaitTime < 5000) {
              throw new Error("Max wait time must be at least 5 seconds");
            }

            const waitSpinner = ora(
              `Processing upload... (max wait: ${Math.round(
                maxWaitTime / 1000
              )}s)`
            ).start();

            try {
              const finalState = await client.waitForUploadCompletion(
                itemId,
                maxWaitTime
              );

              if (finalState === UploadState.SUCCEEDED) {
                waitSpinner.succeed("Upload processing completed");
              } else {
                waitSpinner.fail(`Upload processing failed: ${finalState}`);
                process.exit(1);
              }
            } catch (error) {
              waitSpinner.fail("Upload processing timed out or failed");
              throw error;
            }
          }

          console.log(chalk.green("✅ Upload completed successfully!"));

          if (uploadResponse.crxVersion) {
            console.log(
              chalk.gray(`Package version: ${uploadResponse.crxVersion}`)
            );
          }

          // Auto-publish if requested
          if (opts.autoPublish) {
            console.log(chalk.blue("\n🚀 Auto-publishing..."));

            const publishType =
              opts.publishType === "staged"
                ? PublishType.STAGED_PUBLISH
                : PublishType.DEFAULT_PUBLISH;
            const deployPercentage = parseInt(
              opts.deployPercentage || "100",
              10
            );

            if (
              isNaN(deployPercentage) ||
              deployPercentage < 0 ||
              deployPercentage > 100
            ) {
              throw new Error(
                "Deploy percentage must be a number between 0 and 100"
              );
            }

            const publishSpinner = ora("Publishing item...").start();

            const publishResponse = await client.publishItem(itemId, {
              skipReview: opts.skipReview,
              publishType,
              deployInfos:
                deployPercentage < 100 ? [{ deployPercentage }] : undefined,
            });

            publishSpinner.succeed("Item published successfully");

            if (opts.verbose) {
              console.log(chalk.gray("Publish response:"), publishResponse);
            }

            console.log(chalk.green("✅ Auto-publish completed!"));
            console.log(chalk.gray(`Status: ${publishResponse.state}`));
          }
        } catch (error) {
          uploadSpinner.fail("Upload failed");
          throw error;
        }
      } catch (error) {
        console.error(
          chalk.red("❌ Upload failed:"),
          error instanceof Error ? error.message : error
        );
        process.exit(1);
      }
    }
  );
