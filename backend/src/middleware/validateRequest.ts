import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateRequest = (schema: ZodSchema) => 
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res.status(400).json({ 
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        res.status(400).json({ message: 'Bad Request' });
      }
    }
  };
