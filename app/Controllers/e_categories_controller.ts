import type { HttpContext } from '@adonisjs/core/http'
import ECategory from '#models/e_category'

export default class ECategoriesController {
  /**
   * Tüm kategorileri listele
   * GET /admin/categories
   */
  public async E_index({ response }: HttpContext) {
    try {
      const categories = await ECategory.query()
        .orderBy('id', 'asc')

      return response.json({
        message: 'Kategoriler listelendi',
        data: categories,
        count: categories.length
      })
    } catch (error) {
      console.error('Categories list error:', error)
      return response.status(500).json({ 
        message: 'Kategoriler listelenirken hata oluştu',
        error: String(error) 
      })
    }
  }

  /**
   * Yeni kategori oluştur
   * POST /admin/categories
   */
  public async E_store({ request, response }: HttpContext) {
    // Request verilerini al
    const { name, isActive } = request.only(['name', 'isActive'])

    // Validasyon
    if (!name || name.trim().length === 0) {
      return response.status(400).json({ 
        message: 'Kategori adı zorunludur' 
      })
    }

    // Aynı isimde kategori var mı kontrol et
    const existingCategory = await ECategory.findBy('name', name.trim())
    if (existingCategory) {
      return response.status(400).json({ 
        message: 'Bu isimde bir kategori zaten mevcut' 
      })
    }

    try {
      const category = await ECategory.create({
        name: name.trim(),
        isActive: isActive !== undefined ? isActive : true
      })

      return response.status(201).json({
        message: 'Kategori başarıyla oluşturuldu',
        data: category
      })
    } catch (error) {
      console.error('Category create error:', error)
      return response.status(500).json({ 
        message: 'Kategori oluşturulurken hata oluştu', 
        error: String(error) 
      })
    }
  }

  /**
   * Kategori güncelle
   * POST /admin/categories/:id
   */
  public async E_update({ params, request, response }: HttpContext) {
    // URL parametresinden id al
    const categoryId = params.id

    // Kategoriyi bul
    const category = await ECategory.find(categoryId)
    if (!category) {
      return response.status(404).json({ 
        message: 'Kategori bulunamadı' 
      })
    }

    // Request verilerini al
    const { name, isActive } = request.only(['name', 'isActive'])

    // Validasyon
    if (name && name.trim().length === 0) {
      return response.status(400).json({ 
        message: 'Kategori adı boş olamaz' 
      })
    }

    // Aynı isimde başka kategori var mı kontrol et
    if (name && name.trim() !== category.name) {
      const existingCategory = await ECategory.query()
        .where('name', name.trim())
        .whereNot('id', categoryId)
        .first()

      if (existingCategory) {
        return response.status(400).json({ 
          message: 'Bu isimde bir kategori zaten mevcut' 
        })
      }
    }

    try {
      // Güncelle
      if (name) category.name = name.trim()
      if (isActive !== undefined) category.isActive = isActive

      await category.save()

      return response.json({
        message: 'Kategori başarıyla güncellendi',
        data: category
      })
    } catch (error) {
      console.error('Category update error:', error)
      return response.status(500).json({ 
        message: 'Kategori güncellenirken hata oluştu',
        error: String(error) 
      })
    }
  }

  /**
   * Kategori sil
   * DELETE /admin/categories/:id
   */
  public async E_destroy({ params, response }: HttpContext) {
    // URL parametresinden id al
    const categoryId = params.id

    // Kategoriyi bul
    const category = await ECategory.find(categoryId)
    if (!category) {
      return response.status(404).json({ 
        message: 'Kategori bulunamadı' 
      })
    }

    // Kategoriye ait ürün var mı kontrol et
    await category.load('products')
    if (category.products.length > 0) {
      return response.status(400).json({ 
        message: 'Bu kategoriye ait ürünler bulunuyor. Önce ürünleri silin veya başka kategoriye taşıyın' 
      })
    }

    try {
      await category.delete()

      return response.status(200).json({ 
        message: 'Kategori başarıyla silindi' 
      })
    } catch (error) {
      console.error('Category delete error:', error)
      return response.status(500).json({ 
        message: 'Kategori silinirken hata oluştu',
        error: String(error) 
      })
    }
  }
}