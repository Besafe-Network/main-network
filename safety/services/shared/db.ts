import mongoose from 'mongoose';
import { config } from './config';

mongoose.set('bufferCommands', false);

let isConnected = false;
let connectingPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  const uri = config.mongoUri;
  console.log(`[Database] Connecting to MongoDB (${uri.replace(/:([^:@]+)@/, ':****@')})...`);

  connectingPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  }).then((m) => {
    isConnected = true;
    console.log('[Database] MongoDB connected successfully.');
    return m;
  }).catch((err) => {
    console.error('[Database] MongoDB connection error:', err?.message || err);
    connectingPromise = null;
    throw err;
  });

  return connectingPromise;
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    connectingPromise = null;
    console.log('[Database] MongoDB disconnected.');
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[Database] MongoDB connection disconnected.');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('[Database] MongoDB reconnected.');
});
