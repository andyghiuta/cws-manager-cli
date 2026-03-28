export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

export function wait(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function validateDeployPercentage(percentageStr: string): number {
  const deployPercentage = parseInt(percentageStr, 10);

  if (
    isNaN(deployPercentage) ||
    deployPercentage < 0 ||
    deployPercentage > 100
  ) {
    throw new Error("Deploy percentage must be a number between 0 and 100");
  }

  return deployPercentage;
}
