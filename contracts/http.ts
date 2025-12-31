// import User from '#models/user'

// declare module '@adonisjs/core/http' {
//   interface HttpContext {
//     user?: User
//   }
// }
// //E TİCARET SİTESİ İÇİN YAZILDI!!!!!!!!!!!!!!
import EUser from '#models/e_user'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    user?: EUser
  }
}