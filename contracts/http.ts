import User from '#models/user'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    user?: User
  }
}
