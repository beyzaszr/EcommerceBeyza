import { DateTime } from 'luxon'
import { BaseModel, column,belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/orm'
import EUser from '#models/e_user'
import EOrder from '#models/e_order'

export default class EAddress extends BaseModel {
  public static table = 'e_addresses'

  @column({ isPrimary: true })
  declare id: number

  @column()
  public userId: number

  @column()
  public title: string

  @column()
  public city: string

  @column()
  public district: string

  @column()
  public fullAddress: string

  @column()
  public isDefault: boolean

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