import mongoose from 'mongoose';

const TEST_MONGO_URI = process.env.MONGO_URI 
  ? process.env.MONGO_URI.replace(/\/([^/]+)$/, '/wikidb_test')
  : 'mongodb://127.0.0.1:27017/wikidb_test';

export const connect = async () => {
  console.log(`Connecting to Test DB at: ${TEST_MONGO_URI}`);
  await mongoose.connect(TEST_MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Fail fast if can't find server
    connectTimeoutMS: 10000,
  });
};

export const close = async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.connection.close();
};

export const clear = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
