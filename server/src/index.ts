import { Hono } from 'hono'
import {  getDb } from './db'
import { usersTable } from './db/schema'
const app = new Hono<{Bindings:{
  DATABASE_URL:string
}}>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})
app.get('/users',async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const allUsers = await db.select().from(usersTable) 
  return c.json(allUsers)
})
export default app
