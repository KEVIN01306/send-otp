import { PrismaOtpRepository } from '../../modules/Otp/infrastructure/prisma-otp.repository.js';
import { Logger } from '../logger/logger.js';

export class OtpCleanupTask {
  private static intervalId: NodeJS.Timeout | null = null;
  private static otpRepository = new PrismaOtpRepository();

  /**
   * Runs the cleanup once, deleting tokens expired/used older than retention hours.
   */
  public static async runCleanup(retentionHours: number = 24): Promise<number> {
    try {
      const thresholdDate = new Date(Date.now() - retentionHours * 60 * 60 * 1000);
      const count = await this.otpRepository.cleanOldOtps(thresholdDate);
      if (count > 0) {
        Logger.info(`Cleaned up ${count} stale OTP tokens older than ${retentionHours}h`);
      }
      return count;
    } catch (error) {
      Logger.error('Failed to run OTP cleanup task', error);
      return 0;
    }
  }

  /**
   * Starts periodic execution every intervalMs (default 1 hour).
   */
  public static start(intervalMs: number = 60 * 60 * 1000): void {
    if (this.intervalId) return;

    // Run initial cleanup
    this.runCleanup();

    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, intervalMs);

    // Ensure interval does not prevent process exit
    if (this.intervalId.unref) {
      this.intervalId.unref();
    }

    Logger.info('OTP background cleanup scheduler started');
  }

  /**
   * Stops periodic execution.
   */
  public static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      Logger.info('OTP background cleanup scheduler stopped');
    }
  }
}
