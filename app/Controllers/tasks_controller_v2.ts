import Task from '#models/task'

export default class TasksControllerV2 {
  public async getTasks({ user, response }: any) {
    const tasks = await Task.query().where('user_id', user!.id)
    return response.json({ status_code: 200, message: 'OK', data: tasks, success: true })
  }

  public async createTasks({ request, user, response }: any) {
    const task = await Task.create({
      title: request.input('title'),
      description: request.input('description'),
      userId: user!.id,
    })

    return response.status(201).json({ status_code: 201, message: 'Created', data: task, success: true })
  }

  public async updateTasks({ params, request, user, response }: any) {
    const task = await Task.query()
      .where('id', params.id)
      .where('user_id', user!.id)
      .first()

    if (!task) {
      return response.status(404).json({ status_code: 404, message: 'Not Found', success: false })
    }

    task.merge(request.only(['title', 'description', 'is_completed']))
    await task.save()
    return response.json({ status_code: 200, message: 'Updated', data: task, success: true })
  }

  public async deleteTasks({ params, user, response }: any) {
    const task = await Task.query()
      .where('id', params.id)
      .where('user_id', user!.id)
      .first()

    if (!task) {
      return response.status(404).json({ status_code: 404, message: 'Not Found', success: false })
    }

    await task.delete()
    return response.status(200).json({ status_code: 200, message: 'Deleted', success: true })
  }
}
