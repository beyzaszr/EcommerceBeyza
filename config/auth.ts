// import Env from '@ioc:Adonis/Core/Env'

// export default {
//   guard: 'api',
//   guards: {
//     api: {
//       driver: 'oat',
//       tokenProvider: {
//         driver: 'database',
//         table: 'user_tokens',
//       },
//       provider: {
//         driver: 'lucid',
//         identifierKey: 'id',
//         uids: ['email'],
//         model: () => import('#models/e_user'),
//       },
//     },
//   },
// }

// //E TİCARET SİTESİ İÇİN YAZILDI!!!!!!!!!!!!!!
import { defineConfig } from '@adonisjs/auth'
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'

const authConfig = defineConfig({
  default: 'web',
  guards: {
    web: sessionGuard({
      useRememberMeTokens: false,
      provider: sessionUserProvider({
        model: () => import('#models/e_user'),
      }),
    }),
  },
})

export default authConfig