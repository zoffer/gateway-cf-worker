import { Hono } from 'hono'
import { renderer } from './middleware/renderer'
import { verification } from './middleware/verification'
import { emailCode } from './api/tool/email/code'

const app = new Hono()

app.use(renderer)
app.use("/api/*", verification)
app.onError((err, ctx) => {
  console.error(err)
  return ctx.json({ error: "Internal Server Error" }, 500)
})

app.get('/', (c) => {
  return c.render(<h1>Hello!</h1>)
})

app.post('/api/tool/email/code', emailCode)


export default app
