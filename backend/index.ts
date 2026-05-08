import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import {connectDb} from './api/config/db';
import {env} from './api/config/env';
import routes from './api/routes/index';
import {errorHandler} from './api/middleware/errorHandler';
import {sanitize} from './api/middleware/sanitize';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://express-next-auth-kit.vercel.app/'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(sanitize);

app.use('/api', routes);

app.get('/', async (req, res) => {
  res.send('test production!');
});

app.use(errorHandler);

let dbInitPromise: Promise<unknown> | null = null;
const ensureDb = () => {
  if (!dbInitPromise) {
    dbInitPromise = connectDb();
  }
  return dbInitPromise;
};

export default async function handler(
  req: express.Request,
  res: express.Response
) {
  try {
    await ensureDb();
    return app(req, res);
  } catch (error) {
    console.error('Failed to connect to database', error);
    return res.status(500).json({message: 'Database connection failed'});
  }
}

if (process.env.VERCEL !== '1') {
  ensureDb()
    .then(() => {
      app.listen(env.PORT, () => {
        console.log(`Server listening on port ${env.PORT}`);
      });
    })
    .catch(error => {
      console.error('Failed to connect to database', error);
      process.exit(1);
    });
}
