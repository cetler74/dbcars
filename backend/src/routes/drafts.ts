import express, { Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All draft routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// List drafts
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await pool.query(
      `SELECT id, customer_name, vehicle_name, total_price, created_at, updated_at 
       FROM booking_drafts 
       WHERE created_by = $1 
       ORDER BY updated_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

// Get single draft
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await pool.query(
      `SELECT * FROM booking_drafts 
       WHERE id = $1 AND created_by = $2`,
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({ error: 'Failed to fetch draft' });
  }
});

// Save draft (create or update)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id, draft_data, customer_name, vehicle_name, total_price } = req.body;
    
    if (id) {
      // Update existing
      const result = await pool.query(
        `UPDATE booking_drafts 
         SET draft_data = $1, customer_name = $2, vehicle_name = $3, 
             total_price = $4, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $5 AND created_by = $6 
         RETURNING *`,
        [draft_data, customer_name, vehicle_name, total_price, id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Draft not found' });
      }
      
      res.json(result.rows[0]);
    } else {
      // Create new
      const result = await pool.query(
        `INSERT INTO booking_drafts 
         (created_by, draft_data, customer_name, vehicle_name, total_price) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [req.user.id, draft_data, customer_name, vehicle_name, total_price]
      );
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

// Delete draft
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await pool.query(
      'DELETE FROM booking_drafts WHERE id = $1 AND created_by = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

export default router;

