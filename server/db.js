import mongoose from 'mongoose';

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in environment');

  // Sanitize URI of any leading/trailing quotes or whitespace
  uri = uri.trim().replace(/^["']|["']$/g, '');

  const options = {
    family: 4, // Force IPv4 to resolve Atlas replica set shards reliably on Windows
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
  };

  await mongoose.connect(uri, options);
  console.log('Connected to MongoDB Atlas');
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
