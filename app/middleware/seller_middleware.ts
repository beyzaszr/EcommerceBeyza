import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SellerMiddleware {
  public async handle({ response }: HttpContext & { user?: any }, next: NextFn) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ message: 'Önce giriş yapmalısınız' })
    }

    if (user.role !== 'seller') {
      return response.status(403).json({ message: 'Seller yetkisi gerekli' })
    }

    await next()
  }
}