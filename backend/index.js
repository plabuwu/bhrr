import { Hono } from 'hono'

const app = new Hono()
app.get('/api', (c) => c.text('Hono Bhrrrr!'))

export default app