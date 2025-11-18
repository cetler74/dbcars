import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sendContactEmail } from '../services/email';

const router = express.Router();

// Submit contact form
router.post(
  '/',
  [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('message').notEmpty().trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { name, email, message } = req.body;

      // Send email notification
      try {
        await sendContactEmail({ name, email, message });
      } catch (emailError) {
        console.error('Failed to send contact email:', emailError);
        // Don't fail the request if email fails, just log it
      }

      res.json({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.',
      });
    } catch (error) {
      console.error('Contact form submission error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to submit contact form. Please try again later.',
      });
    }
  }
);

export default router;

