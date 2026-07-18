import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import connectDB from './db.js';

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = '0.0.0.0';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).send();
});

// Connect to MongoDB when the server starts
connectDB().catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

if (!process.env.VERCEL) {
  app.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port}`);
  });
}

export default app;
