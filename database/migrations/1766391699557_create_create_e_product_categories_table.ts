import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'e_product_categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      
      // Foreign Keys
      table.bigInteger('product_id').unsigned().notNullable()
        .references('id').inTable('e_products').onDelete('CASCADE')
      
      table.bigInteger('category_id').unsigned().notNullable()
        .references('id').inTable('e_categories').onDelete('CASCADE')

      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()

      // Unique constraint: Aynı ürün - kategori çifti tekrar eklenemesin
      table.unique(['product_id', 'category_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}