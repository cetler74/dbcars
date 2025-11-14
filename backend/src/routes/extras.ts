import express, { Request, Response } from 'express';
import pool from '../config/database';

const router = express.Router();

// Get all extras
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM extras WHERE is_active = true ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching extras:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

