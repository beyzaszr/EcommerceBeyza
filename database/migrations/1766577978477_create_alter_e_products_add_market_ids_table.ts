import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'e_products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Ürünün hangi mağazaya ait olduğu
      table.bigInteger('market_id').unsigned().nullable()
        .references('id').inTable('e_markets').onDelete('CASCADE')
      
      // Index ekle (performans için)
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