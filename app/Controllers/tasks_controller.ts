import Task from '#models/task'


/** 
 * değişkenleri ayrıca al
 * sabit bir dönüş şekli belirler
 * 
 */

// auth bearer access token yapısı 
// login register email i olsun parolası olsun. doğruysa access token oluştursun ve o access token ile ilgili user'a task eklensin. Hangi user'a bu işlemin yapılacağını access token ile anlayalım.

// user_tokens tablosu oluşsun user_id ve token yazılsın. token ile istek geldiğinde bir middleware ile bu token'ın hangi user'a ait olduğu bulunup ilgili işlem o user özelinde yapılsın.
//


/* {
status_code:200 | 201 | 400 | 404,
message:string
data:any
error:string
success:true|false

} */

export default class TasksController {
  async index({ user }) {
    return Task.query().where('user_id', user!.id)
  }

  async store({ request, user }) {
    // let title=request.input('title')
    return Task.create({
      title: request.input('title'),
      description: request.input('description'),
      userId: user!.id,
    })
  }

  async update({ params, request, user, response }) {
    const task = await Task.query()
      .where('id', params.id)
      .where('user_id', user!.id)
      .first()

    if (!task) {
      return response.notFound()
    }

    task.merge(request.only(['title', 'description', 'is_completed']))
    await task.save()
    return task
  }

  async destroy({ params, user, response }) {
    const task = await Task.query()
      .where('id', params.id)
      .where('user_id', user!.id)
      .first()

    if (!task) {
      return response.notFound()
    }

    await task.delete()
    return response.noContent()
  }


  async response(status_code: number, message: string,res:any,response) {

    return response.json({
      status_code: status_code,
      message: message,
    })

  }
}
