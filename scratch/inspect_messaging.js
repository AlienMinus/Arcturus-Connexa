import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../server/.env');

let mongoUri = '';
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('MONGODB_URI=') || trimmed.startsWith('MONGO_URI=')) {
      const eqIdx = trimmed.indexOf('=');
      mongoUri = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      break;
    }
  }
}

const mongoose = (await import('../server/node_modules/mongoose/index.js')).default;
const User = (await import('../server/models/User.js')).default;
const Message = (await import('../server/models/Message.js')).default;

await mongoose.connect(mongoUri);

const users = await User.find({ email: { $in: ['inceptrix@outlook.com', 'dasmanasranjan2005@gmail.com'] } }).lean();
for (const u of users) {
  console.log('=== USER ===', u.firstName, u.lastName, '| email:', u.email, '| id:', u._id);
  console.log('Followers count:', (u.followers || []).length, u.followers);
  console.log('Following count:', (u.following || []).length, u.following);
  console.log('Connections count:', (u.connections || []).length, u.connections);
  const msgs = await Message.find({ $or: [{ senderId: u._id }, { receiverId: u._id }] }).lean();
  console.log('Total messages involving user:', msgs.length);
  msgs.forEach(m => console.log('  msg:', m.senderId, '->', m.receiverId, 'content:', m.content));
}

await mongoose.disconnect();
