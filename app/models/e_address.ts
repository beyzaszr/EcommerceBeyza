import { DateTime } from 'luxon'
import { BaseModel, column,belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import EUser from '#models/e_user'
import EOrder from '#models/e_order'

export default class EAddress extends BaseModel {
  public static table = 'e_addresses'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare title: string

  @column()
  declare city: string

  @column()
  declare district: string

  @column()
  declare fullAddress: string

  @column()
  declare isDefault: boolean

  @belongsTo(() => EUser, {
    foreignKey: 'userId'
  })
  declare user: BelongsTo<typeof EUser>

  @hasMany(() => EOrder, {
    foreignKey: 'addressId'
  })
  declare orders: HasMany<typeof EOrder>
  
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}