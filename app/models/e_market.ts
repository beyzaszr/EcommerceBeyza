import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import EUser from '#models/e_user'
import EAddress from '#models/e_address'
import EProduct from '#models/e_product'
import ECategory from '#models/e_category'

export default class EMarket extends BaseModel {
  public static table = 'e_markets'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare slug: string

  @column()
  declare phone: string | null

  @column()
  declare email: string | null

  @column()
  declare addressId: number | null

  @column()
  declare isActive: boolean

  @column()
  declare isVerified: boolean

  // İlişkiler
  @belongsTo(() => EUser, {
    foreignKey: 'userId'
  })
  declare user: BelongsTo<typeof EUser>

  @belongsTo(() => EAddress, {
    foreignKey: 'addressId'
  })
  declare address: BelongsTo<typeof EAddress>

  @hasMany(() => EProduct, {
    foreignKey: 'marketId'
  })
  declare products: HasMany<typeof EProduct>

  @hasMany(() => ECategory, {
    foreignKey: 'marketId'
  })
  declare categories: HasMany<typeof ECategory>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}