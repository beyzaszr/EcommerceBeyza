import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import EOrder from '#models/e_order'
import EProduct from '#models/e_product'

export default class EOrderItem extends BaseModel {
  public static table = 'e_order_items'

  @column({ isPrimary: true })
  declare id: number

  @column()
  public orderId: number

  @column()
  public productId: number

  @column()
  public quantity: number

  @column()
  public unitPrice: number

  @column()
  public totalPrice: number

  @belongsTo(() => EOrder, {
    foreignKey: 'orderId'
  })
  declare order: BelongsTo<typeof EOrder>

  // DEĞİŞİKLİK: foreignKey: 'productId' eklendi
  @belongsTo(() => EProduct, {
    foreignKey: 'productId'
  })
  declare product: BelongsTo<typeof EProduct>
  
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}