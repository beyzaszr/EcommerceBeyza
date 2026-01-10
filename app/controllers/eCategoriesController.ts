import type { HttpContext } from '@adonisjs/core/http'
import ECategory from '#models/e_category'
import EMarket from '#models/e_market'

export default class ECategoriesController {
  /**
   * Tüm kategorileri listele
   * GET /admin/categories
   */
  public async E_index({ response, user }: HttpContext & { user?: any }) {
    try {
      const query = ECategory.query()

      // Eğer kullanıcı seller ise, sadece kendi mağaza kategorilerini ve global kategorileri görsün
      if (user.role === 'seller') {
        const market = await EMarket.findBy('user_id', user.id)
        if (market) {
          query.where((q) => {
            q.whereNull('marketId').orWhere('marketId', market.id)
          })
        } else {
          query.whereNull('marketId')
        }
      }

      const categories = await query.orderBy('id', 'asc')

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
  public async E_store({ request, response, user}: HttpContext & { user: any }) {
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
      let marketId: number | null = null

      // Seller ise marketini bul ve ID'sini ata
      if (user.role === 'seller') {
        const market = await EMarket.findBy('user_id', user.id)
        if (!market) return response.status(403).json({ message: 'Mağazanız bulunamadı' })
        marketId = market.id
      }

      const category = await ECategory.create({
        name: name.trim(),
        isActive: isActive !== undefined ? isActive : true,
        marketId: marketId // Admin yaparsa null (global) kalır
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
  public async E_update({ params, request, response}: HttpContext & { user?: any }) {
       const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }
    // URL parametresinden id al
    const categoryId = params.id

    // Kategoriyi bul
    const category = await ECategory.find(categoryId)
    if (!category) {
      return response.status(404).json({ 
        message: 'Kategori bulunamadı' 
      })
    }

        // Güvenlik: Seller sadece kendi mağazasının kategorisini değiştirebilir
    if (user.role === 'seller') {
      const market = await EMarket.findBy('userId', user.id)
      if (!market) {
        return response.status(403).json({ 
          message: 'Mağazanız bulunamadı' 
        })
      }
      
      if (category.marketId !== market.id) {
        return response.status(403).json({ 
          message: 'Bu kategoriyi düzenleme yetkiniz yok' 
        })
      }
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
  public async E_destroy({ params, response }: HttpContext& { user?: any }) {
        const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }
    // URL parametresinden id al
    const categoryId = params.id

    // Kategoriyi bul
    const category = await ECategory.find(categoryId)
    if (!category) {
      return response.status(404).json({ 
        message: 'Kategori bulunamadı' 
      })
    }

        // Güvenlik: Seller sadece kendi mağazasının kategorisini silebilir
    if (user.role === 'seller') {
      const market = await EMarket.findBy('userId', user.id)
      if (!market) {
        return response.status(403).json({ 
          message: 'Mağazanız bulunamadı' 
        })
      }
      
      if (category.marketId !== market.id) {
        return response.status(403).json({ 
          message: 'Bu kategoriyi silme yetkiniz yok' 
        })
      }
    }

    // Kategoriye ait ürün var mı kontrol et (Many-to-Many ilişki için)
    await category.load('relatedProducts')
    if (category.relatedProducts.length > 0) {
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