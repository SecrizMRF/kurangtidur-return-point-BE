// src/services/historyService.js
const { pool } = require('../db');

const historyService = {
  /**
   * Log item action to history
   * @param {number} itemId - Item ID
   * @param {string} action - Action type: 'created', 'updated', 'status_changed', 'deleted'
   * @param {object} oldData - Previous data (optional)
   * @param {object} newData - New data (optional)
   * @param {string} changedBy - Username who made change
   * @param {string} description - Human readable description
   */
  async logHistory(itemId, action, oldData, newData, changedBy, description) {
    try {
      console.log(`📝 Logging history for item ${itemId}: ${action}`);
      
      const result = await pool.query(
        `INSERT INTO item_history (item_id, action, old_data, new_data, changed_by, description, changed_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          itemId,
          action,
          oldData ? JSON.stringify(oldData) : null,
          newData ? JSON.stringify(newData) : null,
          changedBy,
          description
        ]
      );

      console.log('✅ History logged successfully');
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error logging history:', error);
      throw error;
    }
  },

  /**
   * Get history for a specific item
   * @param {number} itemId - Item ID
   * @param {number} limit - Number of records to fetch
   * @param {number} offset - Offset for pagination
   */
  async getItemHistory(itemId, limit = 20, offset = 0) {
    try {
      console.log(`📖 Fetching history for item ${itemId}`);
      
      // Ensure parameters are valid numbers
      const numItemId = parseInt(itemId, 10);
      const numLimit = parseInt(limit, 10) || 20;
      const numOffset = parseInt(offset, 10) || 0;
      
      console.log(`📖 Query - itemId: ${numItemId}, limit: ${numLimit}, offset: ${numOffset}`);
      
      const result = await pool.query(
        `SELECT 
          id,
          item_id,
          action,
          old_data,
          new_data,
          changed_by,
          changed_at,
          description
         FROM item_history
         WHERE item_id = $1
         ORDER BY changed_at DESC
         LIMIT $2 OFFSET $3`,
        [numItemId, numLimit, numOffset]
      );

      console.log(`✅ Found ${result.rows.length} history records`);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching item history:', error);
      throw error;
    }
  },

  /**
   * Get all history (for admin dashboard)
   * @param {object} filters - Filter options {action, changedBy, itemId, dateRange}
   * @param {number} limit - Number of records
   * @param {number} offset - Offset for pagination
   */
  async getAllHistory(filters = {}, limit = 50, offset = 0) {
    try {
      console.log('📖 Fetching all history with filters:', filters);
      
      // Ensure numeric parameters
      const numLimit = parseInt(limit, 10) || 50;
      const numOffset = parseInt(offset, 10) || 0;
      
      let query = 'SELECT * FROM item_history WHERE 1=1';
      const params = [];
      let paramCount = 1;

      // Filter by action
      if (filters.action) {
        query += ` AND action = $${paramCount++}`;
        params.push(filters.action);
      }

      // Filter by user who made change
      if (filters.changedBy) {
        query += ` AND changed_by = $${paramCount++}`;
        params.push(filters.changedBy);
      }

      // Filter by item
      if (filters.itemId) {
        query += ` AND item_id = $${paramCount++}`;
        params.push(filters.itemId);
      }

      // Filter by date range
      if (filters.startDate && filters.endDate) {
        query += ` AND changed_at BETWEEN $${paramCount++} AND $${paramCount++}`;
        params.push(filters.startDate, filters.endDate);
      }

      query += ` ORDER BY changed_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
      params.push(numLimit, numOffset);

      console.log('📖 Query:', query);
      console.log('📖 Params:', params);

      const result = await pool.query(query, params);
      
      console.log(`✅ Found ${result.rows.length} history records`);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching all history:', error);
      throw error;
    }
  },

  /**
   * Get history count for an item
   * @param {number} itemId - Item ID
   */
  async getHistoryCount(itemId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM item_history WHERE item_id = $1',
        [itemId]
      );
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('❌ Error getting history count:', error);
      throw error;
    }
  },

  /**
   * Get all history count
   * @param {object} filters - Filter options
   */
  async getAllHistoryCount(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as count FROM item_history WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (filters.action) {
        query += ` AND action = $${paramCount++}`;
        params.push(filters.action);
      }

      if (filters.changedBy) {
        query += ` AND changed_by = $${paramCount++}`;
        params.push(filters.changedBy);
      }

      if (filters.itemId) {
        query += ` AND item_id = $${paramCount++}`;
        params.push(filters.itemId);
      }

      const result = await pool.query(query, params);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('❌ Error getting history count:', error);
      throw error;
    }
  },

  /**
   * Format history for display (parse JSON)
   */
  formatHistory(historyRecord) {
    try {
      return {
        ...historyRecord,
        old_data: historyRecord.old_data ? JSON.parse(historyRecord.old_data) : null,
        new_data: historyRecord.new_data ? JSON.parse(historyRecord.new_data) : null
      };
    } catch (error) {
      console.error('❌ Error formatting history:', error);
      return historyRecord;
    }
  }
};

module.exports = historyService;
