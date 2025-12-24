import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'e_addresses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.bigInteger('user_id').unsigned().notNullable()
        .references('id').inTable('e_users').onDelete('CASCADE')
      table.string('title', 255).notNullable()
      table.string('city', 100).notNullable()
      table.string('district', 100).notNullable()
      table.text('full_address').notNullable()
      table.boolean('is_default').defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}