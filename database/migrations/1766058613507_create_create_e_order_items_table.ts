import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'e_order_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.bigInteger('order_id').unsigned().notNullable()
        .references('id').inTable('e_orders')
      table.bigInteger('product_id').unsigned().notNullable()
        .references('id').inTable('e_products')
      table.integer('quantity').notNullable()
      table.decimal('unit_price', 10, 2).notNullable()
      table.decimal('total_price', 10, 2).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}