import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class TestTaskController {
  public async show({ response }: HttpContextContract) {
    const task = {
      id: 1,
      userId: '1',
      title: 'adonis task',
      description:' ',
      isCompleted: false,
      role: '',
    }

    return response.json(task)
  }
}
