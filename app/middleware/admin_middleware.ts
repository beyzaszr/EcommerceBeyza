/*
// Versiyon 1
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class AdminMiddleware {
  public async handle(ctx: HttpContextContract, next: () => Promise<void>) {
    const user = (ctx as any).user

    if (!user || user.role !== 'admin') {
      return ctx.response.unauthorized({ message: 'Admin yetkisi gerekli' })
    }

    await next()
  }
}
//e ticaret admin yetkisi kontrol middleware'i */

import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
  public async handle({ response }: HttpContext & { user?: any }, next: NextFn) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ message: 'Önce giriş yapmalısınız' })
    }

    if (user.role !== 'admin' && user.role !== 'seller') {
      return response.status(403).json({ message: 'Admin yetkisi gerekli' })
    }

    await next()
  }
}