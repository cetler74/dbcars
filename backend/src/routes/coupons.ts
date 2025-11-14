import express, { Request, Response } from 'express';
import pool from '../config/database';

const router = express.Router();

// Validate coupon code
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { total_amount, rental_days } = req.query;

    const result = await pool.query(
      `SELECT * FROM coupons 
       WHERE code = $1 
       AND is_active = true 
       AND valid_from <= CURRENT_DATE 
       AND valid_until >= CURRENT_DATE
       AND (usage_limit IS NULL OR usage_count < usage_limit)`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired coupon' });
    }

    const coupon = result.rows[0];

    // Validate minimum requirements
    if (coupon.minimum_rental_days && rental_days) {
      if (parseInt(rental_days as string) < coupon.minimum_rental_days) {
        return res.status(400).json({
          error: `This coupon requires a minimum of ${coupon.minimum_rental_days} rental days`,
        });
      }
    }

    if (coupon.minimum_amount && total_amount) {
      if (parseFloat(total_amount as string) < coupon.minimum_amount) {
        return res.status(400).json({
          error: `This coupon requires a minimum amount of ${coupon.minimum_amount}`,
        });
      }
    }

    res.json(coupon);
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

