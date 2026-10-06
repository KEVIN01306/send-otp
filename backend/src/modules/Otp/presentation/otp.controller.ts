import { Request, Response, NextFunction } from 'express';
import { SendOtpUseCase } from '../application/send-otp.usecase.js';
import { VerifyOtpUseCase } from '../application/verify-otp.usecase.js';

export class OtpController {
  constructor(
    private sendOtpUseCase: SendOtpUseCase,
    private verifyOtpUseCase: VerifyOtpUseCase
  ) {}

  public sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.projectId!;
      const projectName = req.project?.name;
      const { email, type } = req.body;

      const result = await this.sendOtpUseCase.execute({
        projectId,
        projectName,
        email,
        type,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.projectId!;
      const { email, code, type } = req.body;

      const result = await this.verifyOtpUseCase.execute({
        projectId,
        email,
        code,
        type,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
