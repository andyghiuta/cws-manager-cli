#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import packageJson from "../package.json";

// Import command handlers
import { uploadCommand } from "./commands/upload";
import { publishCommand } from "./commands/publish";
import { statusCommand } from "./commands/status";
import { configureCommand } from "./commands/configure";
import { cancelCommand } from "./commands/cancel";
import { deployCommand } from "./commands/deploy";

const program = new Command();

program
  .name("cws")
  .description(
    "CLI tool for managing Chrome extensions in the Chrome Web Store"
  )
  .version(packageJson.version);

// Global options
program
  .option("-c, --config <path>", "path to config file")
  .option("-v, --verbose", "enable verbose output")
  .option("--dry", "dry run mode (don't actually make API calls)");

// Commands
program
  .addCommand(configureCommand)
  .addCommand(uploadCommand)
  .addCommand(publishCommand)
  .addCommand(statusCommand)
  .addCommand(cancelCommand)
  .addCommand(deployCommand);

// Error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
});

program.exitOverride((err) => {
  if (err.code === "commander.version") {
    console.log(packageJson.version);
    process.exit(0);
  }
  if (err.code === "commander.help") {
    console.log(err.message);
    process.exit(0);
  }
  console.error(chalk.red(`Error: ${err.message}`));
  process.exit(err.exitCode);
});

// Parse arguments
if (process.argv.length === 2) {
  program.help();
} else {
  program.parse();
}
