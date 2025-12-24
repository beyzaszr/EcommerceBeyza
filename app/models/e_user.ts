import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, hasOne} from '@adonisjs/lucid/orm'
import type { HasMany,HasOne } from '@adonisjs/lucid/orm'
import EOrder from '#models/e_order'
import EAddress from '#models/e_address'
import EMarket from '#models/e_market'

export default class EUser extends BaseModel {
  public static table = 'e_users'

  @column({ isPrimary: true })
  declare id: number

  @column()
  public name: string

  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public role: 'admin' | 'customer' | 'seller'

  @hasMany(() => EOrder, {
    foreignKey: 'userId'
  })
  declare orders: HasMany<typeof EOrder>

  @hasMany(() => EAddress, {
    foreignKey: 'userId'
  })
  declare addresses: HasMany<typeof EAddress>
 
@hasOne(() => EMarket, { //1 to 1 ilişki magaza ve user arasında
    foreignKey: 'userId'
  })
  declare market: HasOne<typeof EMarket>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}