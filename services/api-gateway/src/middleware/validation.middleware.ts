import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { logger } from '../utils/logger';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors: Array<{ field: string; message: string }> = [];
    errors.array().forEach((err: any) => {
      extractedErrors.push({
        field: err.path || err.param,
        message: err.msg,
      });
    });

    logger.warn('Validation failed:', extractedErrors);

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: extractedErrors,
    });
  };
};

export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Remove any potentially dangerous characters from inputs
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};
