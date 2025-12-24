// import type { HttpContext } from '@adonisjs/core/http'

import User from '#models/user'
import UserToken from '#models/user_token'
import { randomBytes } from 'crypto'

export default class UsersController {
  public async registerUser({ request, response }: any) {
    const { email, password } = request.only(['email', 'password'])

    if (!email || !password) {
      return response.status(400).json({ message: 'Email and password are required' })
    }

    const exists = await User.findBy('email', email)
    if (exists) {
      return response.status(400).json({ message: `Email ${email} already exists` })
    }

    const apiToken = randomBytes(24).toString('hex')

    const user = await User.create({
      email,
      password,
      apiToken,
    })

    // store token in user_tokens table
    await UserToken.create({ userId: user.id, token: apiToken })

    return response.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, apiToken: apiToken },
    })
  }

  public async login({ request, response }: any) {
    const { email, password } = request.only(['email', 'password'])

    if (!email || !password) {
      return response.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findBy('email', email)
    if (!user || user.password !== password) {
      return response.status(401).json({ message: 'Invalid credentials' })
    }

    // create a new token for this login and persist in user_tokens
    const apiToken = randomBytes(24).toString('hex')
    await UserToken.create({ userId: user.id, token: apiToken })

    // also update users.api_token to current token for compatibility
    user.apiToken = apiToken
    await user.save()

    return response.status(200).json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, apiToken: apiToken },
    })
  }
}
