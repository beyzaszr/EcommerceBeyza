import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import EUser from '#models/e_user'
import EAddress from '#models/e_address'
import EOrderItem from '#models/e_order_item'

export default class EOrder extends BaseModel {
  public static table = 'e_orders'
  @column({ isPrimary: true })
  declare id: number

  @column()
  public userId: number

  @column()
  public addressId: number | null

  @column()
  public totalPrice: number

  @column()
  public status: 'cart' | 'pending' | 'paid' | 'canceled' | 'shipped'

 @belongsTo(() => EUser, {
    foreignKey: 'userId'
  })
  declare user: BelongsTo<typeof EUser>

  @belongsTo(() => EAddress, {
    foreignKey: 'addressId'
  })
  declare address: BelongsTo<typeof EAddress>

  @hasMany(() => EOrderItem, {
    foreignKey: 'orderId'
  })
  declare items: HasMany<typeof EOrderItem>
  
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}