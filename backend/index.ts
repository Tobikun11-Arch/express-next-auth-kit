import app from './app';
import {connectDb} from './api/config/db';
import {env} from './api/config/env';

let dbInitPromise: Promise<unknown> | null = null;
const ensureDb = () => {
  if (!dbInitPromise) {
    dbInitPromise = connectDb();
  }
  return dbInitPromise;
};

export default async function handler(
  req: import('express').Request,
  res: import('express').Response
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
