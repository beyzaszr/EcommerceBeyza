import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/orm'
import ECategory from '#models/e_category'
import EOrderItem from '#models/e_order_item'
import EMarket from '#models/e_market'

export default class EProduct extends BaseModel {
  public static table = 'e_products'

  @column({ isPrimary: true })
  declare id: number

  @column()
  public categoryId: number

  @column()
  declare marketId: number | null

  @column()
  public name: string

  @column()
  public description: string | null

  @column()
  public price: number

  @column()
  public stock: number

  @column()
  public isActive: boolean

  // Mağaza ilişkisi
  @belongsTo(() => EMarket, {
    foreignKey: 'marketId'
  })
  declare market: BelongsTo<typeof EMarket>

// 1 product 1 categoriye aitse burası
  @belongsTo(() => ECategory, {
    foreignKey: 'categoryId'
  })
  declare category: BelongsTo<typeof ECategory>

// Birden fazla kategori (YENİ - Many-to-Many ilişkisi için, pivot table 'ara tablo' için)
  @manyToMany(() => ECategory, {
    pivotTable: 'e_product_categories',
    localKey: 'id',
    pivotForeignKey: 'product_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'category_id',
  })
  declare categories: ManyToMany<typeof ECategory>

  // foreignKey: 'productId' eklendi
  @hasMany(() => EOrderItem, {
    foreignKey: 'productId'
  })
  declare orderItems: HasMany<typeof EOrderItem>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}