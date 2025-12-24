/*import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class BearerAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * Middleware logic goes here (before the next call)
     */
    //console.log(ctx)

    /**
     * Call next method in the pipeline and return its output
     *//*
    const output = await next()
    return output
  }
}*/
/*
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import UserToken from '#models/user_token'
import EUser from '#models/e_user'
import EUserToken from '#models/e_user_token'
import UserToken from '#models/user_token'
import EUser from '#models/e_user'
import EUserToken from '#models/e_user_token'
import UserToken from '#models/user_token'

export default class BearerAuthMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const authHeader = ctx.request.header('authorization')

    if (!authHeader) {
      return ctx.response.unauthorized({ message: 'Token missing' })
    }

    const [, token] = authHeader.split(' ')

    if (!token) {
      return ctx.response.unauthorized({ message: 'Invalid token format' })
    }

    const user = await User.query()
      .where('api_token', token)
      .first()

    if (!user || token !== user.apiToken) {
      return ctx.response.unauthorized({ message: 'Invalid token' })
    }

    // 👇 user'ı context'e ekliyoruz
    ctx.user = user

    await next()
  }
}

*//*
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class BearerAuthMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const authHeader = ctx.request.header('authorization')

    if (!authHeader) {
      return ctx.response.unauthorized({ message: 'Token missing' })
    }

    const [type, token] = authHeader.split(' ')

    if (type !== 'Bearer' || !token) {
      return ctx.response.unauthorized({ message: 'Invalid token format' })
    }

    // find token in user_tokens and load related user
    const tokenEntry = await UserToken.query().where('token', token).first()
    if (!tokenEntry) {
      return ctx.response.unauthorized({ message: 'Invalid token' })
    }

    const user = await User.find(tokenEntry.userId)
    if (!user) {
      return ctx.response.unauthorized({ message: 'Invalid token' })
    }

    ctx.user = user

    await next()
  }
}
*/


// import type { HttpContext } from '@adonisjs/core/http'
// import User from '#models/user'
// import UserToken from '#models/user_token'  
// import EUser from '#models/e_user'          
// import EUserToken from '#models/e_user_token' 

// export default class BearerAuthMiddleware {
//   public async handle(ctx: HttpContext, next: () => Promise<void>) {
//     // Allow public routes (register/login) to bypass bearer auth
//       const publicPaths = ['/set-email', '/login', '/registerUser', '/e-register', '/e-login']
//     const reqPath = ctx.request.url() || (ctx.request as any).path?.() || ''
//     if (publicPaths.some((p) => reqPath.startsWith(p))) {
//       return next()
//     }

//     const authHeader = ctx.request.header('Authorization')

//     if (!authHeader) {
//       return ctx.response.unauthorized({ message: 'Token missing' })
//     }

//     const [type, token] = authHeader.split(' ')

//     if (type !== 'Bearer' || !token) {
//       return ctx.response.unauthorized({ message: 'Invalid token format' })
//     }

// /*const user = await User.query()
//       .where('api_token', token)
//       .first()
//  */

//     // Try legacy `user_tokens` table first
//     let tokenEntry = await UserToken.query().where('token', token).first()
//     if (tokenEntry) {
//       const user = await User.find(tokenEntry.userId)
//       if (!user) return ctx.response.unauthorized({ message: 'Invalid token' })
//       ctx.user = user
//       return next()
//     }

//     // Try e-commerce tokens
//     tokenEntry = await EUserToken.query().where('token', token).first()
//     if (tokenEntry) {
//       const user = await EUser.find(tokenEntry.userId)
//       if (!user) return ctx.response.unauthorized({ message: 'Invalid token' })
//       ctx.user = user
//       return next()
//     }

//     // Fallback: check api_token column on users (legacy)
//     const user = await User.query().where('api_token', token).first()
//     if (!user) {
//       return ctx.response.unauthorized({ message: 'Invalid token' })
//     }

//     ctx.user = user

//     await next()
//   }
// }
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import UserToken from '#models/user_token'
import EUser from '#models/e_user'
import EUserToken from '#models/e_user_token'

export default class BearerAuthMiddleware {
  public async handle(ctx: HttpContext, next: () => Promise<void>) {
    // Public rotaları atlat
    const publicPaths = ['/set-email', '/login', '/registerUser', '/e-register', '/e-login']
    const reqPath = ctx.request.url() || (ctx.request as any).path?.() || ''
    
    if (publicPaths.some((p) => reqPath.startsWith(p))) {
      return next()
    }

    const authHeader = ctx.request.header('Authorization')

    if (!authHeader) {
      return ctx.response.unauthorized({ message: 'Token missing' })
    }

    const [type, token] = authHeader.split(' ')

    if (type !== 'Bearer' || !token) {
      return ctx.response.unauthorized({ message: 'Invalid token format' })
    }

    // E-commerce token kontrolü
    const tokenEntry = await EUserToken.query().where('token', token).first()
    if (tokenEntry) {
      const user = await EUser.find(tokenEntry.userId)
      if (!user) {
        return ctx.response.unauthorized({ message: 'Invalid token' })
      }
      ;(ctx as any).user = user
      return next()
    }

    // Legacy user tokens kontrolü
    const legacyTokenEntry = await UserToken.query().where('token', token).first()
    if (legacyTokenEntry) {
      const user = await User.find(legacyTokenEntry.userId)
      if (!user) {
        return ctx.response.unauthorized({ message: 'Invalid token' })
      }
      ;(ctx as any).user = user
      return next()
    }

    // Fallback: api_token column kontrolü
    const user = await User.query().where('api_token', token).first()
    if (!user) {
      return ctx.response.unauthorized({ message: 'Invalid token' })
    }

    ;(ctx as any).user = user
    await next()
  }
}
