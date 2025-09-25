import express, { Express, Request, Response } from 'express';
import { usersTable } from './db/schema';
import { db } from './db';

import dotenv from "dotenv";
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get('/', async (req: Request, res: Response) => {
   const user: typeof usersTable.$inferInsert = {
    name: 'John',
    age: 30,
    email: 'john@example.com',
  };
  await db.insert(usersTable).values(user);
  console.log('New user created!')
  const users = await db.select().from(usersTable);
  console.log('Getting all users from the database: ', users)
  res.send('Express + TypeScript Server');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
}

export default app;