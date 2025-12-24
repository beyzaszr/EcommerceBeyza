import Env from '@ioc:Adonis/Core/Env'

export default {
  guard: 'api',
  guards: {
    api: {
      driver: 'oat',
      tokenProvider: {
        driver: 'database',
        table: 'user_tokens',
      },
      provider: {
        driver: 'lucid',
        identifierKey: 'id',
        uids: ['email'],
        model: () => import('#models/e_user'),
      },
    },
  },
}

//E TİCARET SİTESİ İÇİN YAZILDI!!!!!!!!!!!!!!