import chalk from "chalk";

export class Logger {
  private static isVerbose: boolean = false;

  static setVerbose(verbose: boolean): void {
    this.isVerbose = verbose;
  }

  static red(message: string, ...args: unknown[]): void {
    console.error(chalk.red(message), ...args);
  }

  static green(message: string, ...args: unknown[]): void {
    console.log(chalk.green(message), ...args);
  }

  static blue(message: string): void {
    console.log(chalk.blue(message));
  }

  static gray(message: string, ...args: unknown[]): void {
    console.log(chalk.gray(message), ...args);
  }

  static yellow(message: string, ...args: unknown[]): void {
    console.log(chalk.yellow(message), ...args);
  }

  static verbose(message: string, ...args: unknown[]): void {
    if (this.isVerbose) {
      console.log(chalk.gray(message), ...args);
    }
  }
}
