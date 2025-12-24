import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'e_markets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      
      // Mağaza sahibi (seller)
      table.bigInteger('user_id').unsigned().notNullable()
        .references('id').inTable('e_users').onDelete('CASCADE')
        .unique() // Bir kullanıcının sadece bir mağazası olabilir
      
      // Mağaza bilgileri
      table.string('name', 255).notNullable().unique()
      table.text('description').nullable()
      table.string('slug', 255).notNullable().unique() // SEO-friendly URL
      
      // Mağaza iletişim bilgileri
      table.string('phone', 50).nullable()
      table.string('email', 255).nullable()
      
      // Mağaza adresi (e_addresses tablosundan)
      table.bigInteger('address_id').unsigned().nullable()
        .references('id').inTable('e_addresses').onDelete('SET NULL')
      
      // Mağaza durumu
      table.boolean('is_active').defaultTo(true)
      table.boolean('is_verified').defaultTo(false) // Admin onayı için
      
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}