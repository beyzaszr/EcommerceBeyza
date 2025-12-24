import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class TestController {
  public async show({ response }: HttpContextContract) {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'user',
    }

    return response.json(user)
  }
}
