import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate } from '@adonisjs/lucid/orm'
import { randomBytes } from 'crypto'

export default class EUserToken extends BaseModel {
  public static table = 'e_user_tokens'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'user_id' })
  public userId: number

  @column()
  public token: string

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  public createdAt: DateTime

  @beforeCreate()
  public static async ensureToken(userToken: EUserToken) {
    if (!userToken.token) {
      userToken.token = randomBytes(24).toString('hex')
    }
  }
}
