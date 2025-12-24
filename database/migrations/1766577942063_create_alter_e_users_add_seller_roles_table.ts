import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'e_users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Enum'ı yeniden tanımlayarak seller ekle
      table.dropColumn('role')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.enum('role', ['admin', 'customer', 'seller']).defaultTo('customer')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('role')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.enum('role', ['admin', 'customer']).defaultTo('customer')
    })
  }
}