import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'e_order_items'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Sipariş öğesinin hangi mağazadan olduğunu takip et
      table.bigInteger('market_id').unsigned().nullable()
        .references('id').inTable('e_markets').onDelete('SET NULL')
      
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