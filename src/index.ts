import express from 'express';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import documentRoutes from './routes/documentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wikidb';

app.use(express.json());

// Routes
app.use('/api/documents', documentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT} (0.0.0.0)`);
      });
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB', err);
    });
}

export default app;
