import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import EOrder from '#models/e_order'
import EProduct from '#models/e_product'
import EMarket from '#models/e_market'


export default class EOrderItem extends BaseModel {
  public static table = 'e_order_items'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: number

  @column()
  declare productId: number

  @column()
  declare quantity: number

  @column()
  declare unitPrice: number

  @column()
  declare totalPrice: number

  @column()
  declare marketId: number | null

  @belongsTo(() => EOrder, {
    foreignKey: 'orderId'
  })
  declare order: BelongsTo<typeof EOrder>

  // foreignKey: 'productId'
  @belongsTo(() => EProduct, {
    foreignKey: 'productId'
  })
  declare product: BelongsTo<typeof EProduct>

  @belongsTo(() => EMarket, {
    foreignKey: 'marketId'
  })
  declare market: BelongsTo<typeof EMarket>
  
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}