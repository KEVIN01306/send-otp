import { Request, Response, NextFunction } from 'express';
import { SendVerificationEmailUseCase } from '../application/send-verification-email.usecase.js';
import { SendCustomEmailUseCase } from '../application/send-custom-email.usecase.js';

export class EmailController {
  constructor(
    private sendVerificationEmailUseCase: SendVerificationEmailUseCase,
    private sendCustomEmailUseCase: SendCustomEmailUseCase
  ) {}

  public sendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.projectId!;
      const projectName = req.project?.name;
      const { email, redirectUrl } = req.body;

      const result = await this.sendVerificationEmailUseCase.execute({
        projectId,
        projectName,
        email,
        redirectUrl,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public sendCustomEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.projectId!;
      const projectName = req.project?.name;
      const { to, subject, htmlContent, logoUrl } = req.body;

      const result = await this.sendCustomEmailUseCase.execute({
        projectId,
        projectName,
        to,
        subject,
        htmlContent,
        logoUrl,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
