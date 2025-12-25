import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany, BelongsTo  } from '@adonisjs/lucid/orm'
import EProduct from '#models/e_product'
import EMarket from '#models/e_market'

export default class ECategory extends BaseModel {
  public static table = 'e_categories'

  @column({ isPrimary: true })
  declare id: number

  @column()
  public name: string

  // NULL ise global, değilse mağazaya özel
  @column()
  declare marketId: number | null

  @column()
  public isActive: boolean

  // Mağaza ilişkisi
  @belongsTo(() => EMarket, {
    foreignKey: 'marketId'
  })
  declare market: BelongsTo<typeof EMarket>

  // @hasMany(() => EProduct, {
  //   foreignKey: 'categoryId'
  // })
  // declare products: HasMany<typeof EProduct>

  // YENİ - Many-to-Many: Bu kategoriye ait tüm ürünler, pivot table için gerekli
  @manyToMany(() => EProduct, {
    pivotTable: 'e_product_categories',
    localKey: 'id',
    pivotForeignKey: 'category_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'product_id',
  })
  declare relatedProducts: ManyToMany<typeof EProduct>
  
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}