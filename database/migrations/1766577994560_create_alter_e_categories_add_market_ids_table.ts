import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'e_categories'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // NULL ise global kategori (admin tarafından), değilse mağazaya özel
      table.bigInteger('market_id').unsigned().nullable()
        .references('id').inTable('e_markets').onDelete('CASCADE')
      
      table.index('market_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('market_id')
      table.dropColumn('market_id')
    })
  }
}