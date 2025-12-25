import type { HttpContext } from '@adonisjs/core/http'
import EProduct from '#models/e_product'
import ECategory from '#models/e_category'

export default class EProductsController {
  /**
   * Tüm ürünleri listele
   * GET /admin/products
   */
  public async E_index({ response }: HttpContext) {
    try {
      const products = await EProduct.query()
        .preload('categories') // Sadece many-to-many kategoriler
        .orderBy('id', 'desc')

      return response.json({
        message: 'Ürünler listelendi',
        data: products,
        count: products.length
      })
    } catch (error) {
      console.error('Products list error:', error)
      return response.status(500).json({
        message: 'Ürünler listelenirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Yeni ürün oluştur
   * POST /admin/products
   */
  public async E_store({ request, response }: HttpContext) {
    // Request verilerini al
    const { categoryIds, name, description, price, stock, isActive } = request.only([
      'categoryIds',
      'name',
      'description',
      'price',
      'stock',
      'isActive',
    ])

    // Validasyon
    if (!name || name.trim().length === 0) {
      return response.status(400).json({ 
        message: 'Ürün adı zorunludur' 
      })
    }

    if (!price || price <= 0) {
      return response.status(400).json({ 
        message: 'Geçerli bir fiyat giriniz' 
      })
    }

    // En az bir kategori gerekli
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return response.status(400).json({ 
        message: 'En az bir kategori seçilmelidir' 
      })
    }

    try {
      // Tüm kategori ID'lerin geçerli olduğunu kontrol et
      const categories = await ECategory.query().whereIn('id', categoryIds)
      
      if (categories.length !== categoryIds.length) {
        return response.status(400).json({ 
          message: 'Bazı kategori ID\'leri geçersiz' 
        })
      }

      // Ürünü oluştur (categoryId olmadan)
      const product = await EProduct.create({
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price),
        stock: stock !== undefined ? parseInt(stock) : 0,
        isActive: isActive !== undefined ? isActive : true
      })

      // Kategorileri ürüne bağla (pivot table'a ekle)
      await product.related('categories').attach(categoryIds)

      // İlişkileri yükle
      await product.load('categories')

      return response.status(201).json({
        message: 'Ürün başarıyla oluşturuldu',
        data: product,
      })
    } catch (error) {
      console.error('Product create error:', error)
      return response.status(500).json({
        message: 'Ürün oluşturulurken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Ürün güncelle
   * POST /admin/products/:id
   */
  public async E_update({ params, request, response }: HttpContext) {
    // URL parametresinden id al
    const productId = params.id

    // Ürünü bul
    const product = await EProduct.find(productId)
    if (!product) {
      return response.status(404).json({ 
        message: 'Ürün bulunamadı' 
      })
    }

    // Request verilerini al
    const { categoryIds, name, description, price, stock, isActive } = request.only([
      'categoryIds',
      'name',
      'description',
      'price',
      'stock',
      'isActive',
    ])

    // Validasyon
    if (name && name.trim().length === 0) {
      return response.status(400).json({ 
        message: 'Ürün adı boş olamaz' 
      })
    }

    if (price !== undefined && price <= 0) {
      return response.status(400).json({ 
        message: 'Geçerli bir fiyat giriniz' 
      })
    }

    try {
      // Ürün bilgilerini güncelle
      if (name) product.name = name.trim()
      if (description !== undefined) product.description = description?.trim() || null
      if (price) product.price = parseFloat(price)
      if (stock !== undefined) product.stock = parseInt(stock)
      if (isActive !== undefined) product.isActive = isActive

      await product.save()

      // Kategorileri güncelle (pivot table)
      if (categoryIds && Array.isArray(categoryIds)) {
        // Tüm kategori ID'lerin geçerli olduğunu kontrol et
        const categories = await ECategory.query().whereIn('id', categoryIds)
        
        if (categories.length !== categoryIds.length) {
          return response.status(400).json({ 
            message: 'Bazı kategori ID\'leri geçersiz' 
          })
        }

        // Mevcut kategorileri sil ve yenilerini ekle
        await product.related('categories').sync(categoryIds)
      }

      // İlişkileri yükle
      await product.load('categories')

      return response.json({
        message: 'Ürün başarıyla güncellendi',
        data: product,
      })
    } catch (error) {
      console.error('Product update error:', error)
      return response.status(500).json({
        message: 'Ürün güncellenirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Ürüne kategori ekle
   * POST /admin/products/:id/add-categories
   */
  public async addCategories({ params, request, response }: HttpContext) {
    const productId = params.id
    const { categoryIds } = request.only(['categoryIds'])

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return response.status(400).json({ 
        message: 'En az bir kategori ID\'si gerekli' 
      })
    }

    const product = await EProduct.find(productId)
    if (!product) {
      return response.status(404).json({ 
        message: 'Ürün bulunamadı' 
      })
    }

    try {
      // Kategorilerin geçerli olduğunu kontrol et
      const categories = await ECategory.query().whereIn('id', categoryIds)
      
      if (categories.length !== categoryIds.length) {
        return response.status(400).json({ 
          message: 'Bazı kategori ID\'leri geçersiz' 
        })
      }

      // Kategorileri ekle (mevcut olanları değiştirmeden)
      await product.related('categories').attach(categoryIds)

      await product.load('categories')

      return response.json({
        message: 'Kategoriler başarıyla eklendi',
        data: product
      })
    } catch (error) {
      console.error('Add categories error:', error)
      return response.status(500).json({
        message: 'Kategoriler eklenirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Üründen kategori çıkar
   * POST /admin/products/:id/remove-categories
   */
  public async removeCategories({ params, request, response }: HttpContext) {
    const productId = params.id
    const { categoryIds } = request.only(['categoryIds'])

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return response.status(400).json({ 
        message: 'En az bir kategori ID\'si gerekli' 
      })
    }

    const product = await EProduct.find(productId)
    if (!product) {
      return response.status(404).json({ 
        message: 'Ürün bulunamadı' 
      })
    }

    try {
      // Kategorileri çıkar
      await product.related('categories').detach(categoryIds)

      await product.load('categories')

      return response.json({
        message: 'Kategoriler başarıyla çıkarıldı',
        data: product
      })
    } catch (error) {
      console.error('Remove categories error:', error)
      return response.status(500).json({
        message: 'Kategoriler çıkarılırken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Ürün sil
   * DELETE /admin/products/:id
   */
  public async E_destroy({ params, response }: HttpContext) {
    // URL parametresinden id al
    const productId = params.id

    // Ürünü bul
    const product = await EProduct.find(productId)
    if (!product) {
      return response.status(404).json({ 
        message: 'Ürün bulunamadı' 
      })
    }

    // Ürün siparişlerde kullanılmış mı kontrol et
    await product.load('orderItems')
    if (product.orderItems.length > 0) {
      return response.status(400).json({ 
        message: 'Bu ürün siparişlerde kullanılmış. Silinemez, sadece pasif yapılabilir' 
      })
    }

    try {
      // Önce pivot table'dan ilişkileri sil
      await product.related('categories').detach()
      
      // Sonra ürünü sil
      await product.delete()

      return response.json({
        message: 'Ürün başarıyla silindi',
      })
    } catch (error) {
      console.error('Product delete error:', error)
      return response.status(500).json({
        message: 'Ürün silinirken hata oluştu',
        error: String(error)
      })
    }
  }
}