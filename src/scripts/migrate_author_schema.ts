import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Document from '../models/Document.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wikidb';

async function migrate() {
  try {
    console.log('Connecting to MongoDB for migration...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    let totalMigrated = 0;
    const batchSize = 1000;

    while (true) {
      // Find documents where author is a string (old schema)
      // In MongoDB, we can use $type: 'string' to target these specifically.
      const oldDocs = await Document.find({
        'metadata.author': { $type: 'string' }
      }).limit(batchSize);

      if (oldDocs.length === 0) {
        break;
      }

      const bulkOps = oldDocs.map(doc => {
        const oldAuthorName = doc.metadata.author as string;
        return {
          updateOne: {
            filter: { _id: doc._id },
            update: {
              $set: {
                'metadata.author': {
                  id: null,
                  name: oldAuthorName,
                  email: null
                }
              }
            }
          }
        };
      });

      const result = await Document.bulkWrite(bulkOps);
      totalMigrated += result.modifiedCount || 0;
      console.log(`Migrated ${totalMigrated} documents so far...`);
    }

    console.log(`Migration complete. Total documents updated: ${totalMigrated}`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
