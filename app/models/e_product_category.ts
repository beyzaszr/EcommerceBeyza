import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/orm'
import EProduct from '#models/e_product'
import ECategory from '#models/e_category'

export default class EProductCategory extends BaseModel {
  public static table = 'e_product_categories'
  
  @column({ isPrimary: true })
  declare id: number

@column({ isPrimary: true })
  declare id: number

  @column()
  declare productId: number

  @column()
  declare categoryId: number

  @belongsTo(() => EProduct, {
    foreignKey: 'productId'
  })
  declare product: BelongsTo<typeof EProduct>

  @belongsTo(() => ECategory, {
    foreignKey: 'categoryId'
  })
  declare category: BelongsTo<typeof ECategory>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}