import express from 'express';
import cors from 'cors';
import { getFirestore } from './firebaseClient.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Get all invoices
 * GET /api/invoices
 */
app.get('/api/invoices', async (req, res) => {
  try {
    const db = getFirestore();
    const { limit = 50, userId } = req.query;

    let query = db.collection('invoices')
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit));

    if (userId) {
      query = query.where('user_id', '==', userId);
    }

    const snapshot = await query.get();

    const invoices = [];
    snapshot.forEach(doc => {
      invoices.push({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate().toISOString()
      });
    });

    res.json({
      success: true,
      count: invoices.length,
      invoices
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get single invoice by ID
 * GET /api/invoices/:id
 */
app.get('/api/invoices/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const doc = await db.collection('invoices').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      invoice: {
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get invoice statistics
 * GET /api/stats
 */
app.get('/api/stats', async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('invoices').get();

    let totalRevenue = 0;
    let documentTypes = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      totalRevenue += data.grand_total || 0;

      const type = data.document_type || 'unknown';
      documentTypes[type] = (documentTypes[type] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        totalInvoices: snapshot.size,
        totalRevenue,
        documentTypes
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SnapBooks API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 SnapBooks API running on http://localhost:${PORT}`);
  console.log(`📊 Endpoints:`);
  console.log(`   GET /api/invoices - List all invoices`);
  console.log(`   GET /api/invoices/:id - Get single invoice`);
  console.log(`   GET /api/stats - Get statistics`);
  console.log(`   GET /health - Health check\n`);
});

export default app;
