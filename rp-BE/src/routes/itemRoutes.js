const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const historyService = require('../services/historyService');
const { isLogin, isOwnerOrAdmin } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const upload = require('../middleware/upload');

// Validation middleware
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');

// Public routes
router.get(
  '/',
  [
    // Query parameter validation
    query('type').optional().isIn(['lost', 'found', 'all']),
    query('status').optional().isIn(['dicari', 'ditemukan', 'diclaim', 'all']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim().escape()
  ],
  validate,
  itemController.getItems
);

// IMPORTANT: Place specific routes like /me/items BEFORE generic routes like /:id
// This prevents /me/items from being matched as /:id with id='me'
router.get(
  '/me/items',
  isLogin,
  [
    query('type').optional().isIn(['lost', 'found', 'all']),
    query('status').optional().isIn(['dicari', 'ditemukan', 'diclaim', 'all'])
  ],
  validate,
  itemController.getMyItems
);

router.get(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid item ID')
  ],
  validate,
  itemController.getItemById
);

// Protected routes (require authentication)
router.post(
  '/',
  isLogin,
  (req, res, next) => {
    console.log('POST /items - Before multer');
    console.log('Content-Type:', req.get('Content-Type'));
    next();
  },
  upload.single('photo'),
  (req, res, next) => {
    console.log('POST /items - After multer');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    next();
  },
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('item_type').isIn(['lost', 'found']).withMessage('Invalid item type'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('contact_info').trim().notEmpty().withMessage('Contact information is required')
  ],
  validate,
  itemController.createItem
);

router.put(
  '/:id/status',
  isLogin,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid item ID'),
    body('status').isIn(['dicari', 'ditemukan', 'diclaim']).withMessage('Invalid status')
  ],
  validate,
  itemController.updateItemStatus
);

router.put(
  '/:id',
  isLogin,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid item ID'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('item_type').isIn(['lost', 'found']).withMessage('Invalid item type'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('contact_info').trim().notEmpty().withMessage('Contact information is required')
  ],
  validate,
  itemController.updateItem
);

router.delete(
  '/:id',
  isLogin,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid item ID')
  ],
  validate,
  itemController.deleteItem
);

// ===== HISTORY ROUTES =====

// Get all history (admin only) - MUST come before /:id/history to avoid route collision
router.get(
  '/admin/history/all',
  isLogin,
  isAdmin,
  [
    query('action').optional().isIn(['created', 'updated', 'status_changed', 'deleted']),
    query('changedBy').optional().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const { action, changedBy, limit = 50, offset = 0 } = req.query;
      
      // Convert to integers
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      console.log('📖 Admin fetching all history');

      const filters = {};
      if (action) filters.action = action;
      if (changedBy) filters.changedBy = changedBy;

      const history = await historyService.getAllHistory(filters, limitNum, offsetNum);
      const count = await historyService.getAllHistoryCount(filters);
      const formattedHistory = history.map(h => historyService.formatHistory(h));

      res.json({
        success: true,
        data: formattedHistory,
        total: count,
        page: Math.floor(offsetNum / limitNum) + 1,
        pages: Math.ceil(count / limitNum)
      });
    } catch (error) {
      console.error('Error fetching all history:', error);
      next(error);
    }
  }
);

// Get history for a specific item
router.get(
  '/:id/history',
  isLogin,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid item ID'),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      
      // Convert to integers
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      console.log(`📖 Fetching history for item ${id}`);

      const history = await historyService.getItemHistory(id, limitNum, offsetNum);
      const formattedHistory = history.map(h => historyService.formatHistory(h));

      res.json({
        success: true,
        data: formattedHistory
      });
    } catch (error) {
      console.error('Error fetching item history:', error);
      next(error);
    }
  }
);

module.exports = router;