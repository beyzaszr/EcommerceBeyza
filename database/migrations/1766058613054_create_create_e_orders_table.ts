import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'e_orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.bigInteger('user_id').unsigned().notNullable().references('id').inTable('e_users').onDelete('CASCADE')
      table.bigInteger('address_id').unsigned().nullable().references('id').inTable('e_addresses').onDelete('SET NULL')
      table.decimal('total_price', 10, 2).notNullable().defaultTo(0)
      table.enum('status', ['cart','pending', 'paid', 'canceled', 'shipped']).defaultTo('cart')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}