import mongoose from 'mongoose';

const connectDB = async (retries = 5, delay = 3000) => {
  let uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in environment');

  // Sanitize URI of any leading/trailing quotes or whitespace
  uri = uri.trim().replace(/^["']|["']$/g, '');

  // Ensure Mongoose operations buffer for 30s instead of default 10s
  mongoose.set('bufferTimeoutMS', 30000);

  const options = {
    family: 4, // Force IPv4 to resolve Atlas replica set shards reliably on Windows
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri, options);
      console.log('Connected to MongoDB Atlas');
      return;
    } catch (err) {
      console.error(`MongoDB Atlas connection attempt ${attempt}/${retries} failed:`, err?.message || err);
      if (attempt === retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
};

mongoose.connection.on('error', (err) => {
  console.error('MongoDB Atlas connection error:', err?.message || err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB Atlas disconnected. Waiting for reconnection...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB Atlas reconnected successfully.');
});

export default connectDB;
