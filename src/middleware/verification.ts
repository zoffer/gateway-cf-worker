import type { MiddlewareHandler } from 'hono'
import { KEYS } from '../utils/kv'

export const verification: MiddlewareHandler = async (ctx, next) => {
  const authHeader = ctx.req.header('Authorization')
  
  if (!authHeader) {
    return ctx.json({ error: 'Authorization header is required' }, 401)
  }
  
  const res = await ctx.env.kv.get(KEYS.apiSecret(authHeader))
  
  if (!res) {
    return ctx.json({ error: 'Invalid authorization token' }, 401)
  }
  
  await next()
} 

