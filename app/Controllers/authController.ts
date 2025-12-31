/* //VERSION 1
// import type { HttpContext } from '@adonisjs/core/http'

//export default class AuthController {
//}
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { HttpContext } from '@adonisjs/core/http'
import EUser from '#models/e_user'
import EUserToken from '#models/e_user_token'

export default class AuthController {
  public async eRegister({ request, response }: HttpContextContract) {
    const data = request.only(['name', 'email', 'password'])

    const exists = await EUser.findBy('email', data.email)
    if (exists) {
      return response.status(400).json({ message: 'Email already exists' })
    }

    try {
      const user = await EUser.create({
        ...data,
        role: 'customer',
      })

      const userToken = await EUserToken.create({ userId: user.id })

      return response.status(201).json({ user, token: userToken.token })
    } catch (error) {
      return response.status(500).json({ message: 'Failed to create user', error: String(error) })
    }
  }

  public async eLogin({ request, response }: HttpContextContract) {
    const { email, password } = request.only(['email', 'password'])

    const user = await EUser.findBy('email', email)
    if (!user || user.password !== password) {
      return response.status(401).json({ message: 'Invalid credentials' })
    }

    const userToken = await EUserToken.create({ userId: user.id })

    return response.status(200).json({ token: userToken.token })
  }

}
//E TİCARET İÇİN YAZILDI */
import type { HttpContext } from '@adonisjs/core/http'
import EUser from '#models/e_user'
import EUserToken from '#models/e_user_token'

export default class AuthController {
  public async eRegister({ request, response }: HttpContext) {
    const data = request.only(['name', 'email', 'password'])

    const exists = await EUser.findBy('email', data.email)
    if (exists) {
      return response.status(400).json({ message: 'Email already exists' })
    }

    try {
      const user = await EUser.create({
        name: data.name,
        email: data.email,
        password: data.password, // Direkt kaydediyoruz
        role: 'customer',
      })

      const userToken = await EUserToken.create({ userId: user.id })

      return response.status(201).json({ 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }, 
        token: userToken.token 
      })
    } catch (error) {
      return response.status(500).json({ 
        message: 'Failed to create user', 
        error: String(error) 
      })
    }
  }

  public async eLogin({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    const user = await EUser.findBy('email', email)
    if (!user) {
      return response.status(401).json({ message: 'Invalid credentials' })
    }

    // Şifreyi direkt karşılaştır
    if (user.password !== password) {
      return response.status(401).json({ message: 'Invalid credentials' })
    }

    const userToken = await EUserToken.create({ userId: user.id })

    return response.status(200).json({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: userToken.token 
    })
  }

  // Mevcut kullanıcı bilgisini getir
  public async me({ response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ message: 'Unauthorized' })
    }
    
    return response.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    })
  }
}
