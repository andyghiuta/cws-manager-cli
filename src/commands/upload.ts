import { Command } from "commander";
import { existsSync, statSync } from "fs";
import { extname } from "path";
import { ConfigManager } from "../utils/config";
import { ChromeWebStoreClient } from "../services/chrome-webstore-client";
import {
  UploadOptions,
  PublishType,
  UploadState,
  UploadCommandOptions,
} from "../types";
import { formatFileSize } from "../utils/utils";
import { withSpinner, withSpinnerCustom } from "../utils/spinner";
import { Logger } from "../utils/logger";

// Helper function to validate file
function validateUploadFile(file: string): void {
  if (!existsSync(file)) {
    throw new Error(`File not found: ${file}`);
  }

  const fileExt = extname(file).toLowerCase();
  if (![".zip", ".crx"].includes(fileExt)) {
    throw new Error(
      `Unsupported file type: ${fileExt}. Only .zip and .crx files are supported.`
    );
  }
}

// Helper function to handle upload processing
async function handleUploadProcessing(
  client: ChromeWebStoreClient,
  itemId: string,
  uploadResponse: { uploadState?: UploadState },
  maxWaitTime: string
): Promise<void> {
  if (uploadResponse.uploadState !== UploadState.IN_PROGRESS) {
    return;
  }

  const maxWaitTimeMs = parseInt(maxWaitTime || "300", 10) * 1000;

  if (isNaN(maxWaitTimeMs) || maxWaitTimeMs < 5000) {
    throw new Error("Max wait time must be at least 5 seconds");
  }

  await withSpinnerCustom(
    `Processing upload... (max wait: ${Math.round(maxWaitTimeMs / 1000)}s)`,
    async (spinner) => {
      try {
        const state = await client.waitForUploadCompletion(
          itemId,
          maxWaitTimeMs
        );

        if (state === UploadState.SUCCEEDED) {
          spinner.succeed("Upload processing completed");
        } else {
          spinner.fail(`Upload processing failed: ${state}`);
          process.exit(1);
        }

        return state;
      } catch (error) {
        spinner.fail("Upload processing timed out or failed");
        throw error;
      }
    }
  );
}

// Helper function to handle auto-publish
async function handleAutoPublish(
  client: ChromeWebStoreClient,
  itemId: string,
  opts: UploadOptions
): Promise<void> {
  if (!opts.autoPublish) {
    return;
  }

  Logger.blue("\n🚀 Auto-publishing...");

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

  const publishResponse = await withSpinner(
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

  Logger.verbose("Publish response:", JSON.stringify(publishResponse, null, 2));
  Logger.green("✅ Auto-publish completed!");
  Logger.gray(`Status: ${publishResponse.state}`);
}

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
    async (
      itemId: string,
      file: string,
      options: UploadCommandOptions,
      command: Command
    ) => {
      const globalOptions = command.parent?.opts() || {};
      const opts: UploadOptions = {
        ...globalOptions,
        itemId,
        file,
        ...options,
      };

      try {
        // Validate file
        validateUploadFile(file);

        const fileStats = statSync(file);

        Logger.setVerbose(opts.verbose || false);
        Logger.blue("📦 Chrome Web Store Upload");
        Logger.gray(`Item ID: ${itemId}`);
        Logger.gray(`File: ${file} (${formatFileSize(fileStats.size)})`);

        if (opts.dry) {
          Logger.yellow("🏃 Dry run mode - no actual upload will be performed");
          return;
        }

        // Load configuration
        const config = await ConfigManager.loadConfig(opts.config);
        const client = new ChromeWebStoreClient(config);

        // Upload the package
        const uploadResponse = await withSpinner(
          "Uploading package...",
          "Package uploaded successfully",
          "Upload failed",
          () => client.uploadPackage(itemId, file)
        );

        Logger.verbose(
          "Upload response:",
          JSON.stringify(uploadResponse, null, 2)
        );

        // Handle upload processing
        await handleUploadProcessing(
          client,
          itemId,
          uploadResponse,
          opts.maxWaitTime || "300"
        );

        Logger.green("✅ Upload completed successfully!");

        if (uploadResponse.crxVersion) {
          Logger.gray(`Package version: ${uploadResponse.crxVersion}`);
        }

        // Handle auto-publish
        await handleAutoPublish(client, itemId, opts);
      } catch (error) {
        Logger.red(
          "❌ Upload failed:",
          error instanceof Error ? error.message : error
        );
        process.exit(1);
      }
    }
  );
