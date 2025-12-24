import type { HttpContext } from '@adonisjs/core/http'
import EMarket from '#models/e_market'
import EUser from '#models/e_user'
import EAddress from '#models/e_address'

export default class EMarketsController {
  /**
   * Mağaza oluştur (kullanıcı seller olur)
   * POST /customer/create-market
   */
  public async createMarket({ request, response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    // Zaten mağazası var mı kontrol et
    const existingMarket = await EMarket.findBy('userId', user.id)
    if (existingMarket) {
      return response.status(400).json({ 
        message: 'Zaten bir mağazanız var' 
      })
    }

    const { name, description, phone, email, addressId } = request.only([
      'name',
      'description',
      'phone',
      'email',
      'addressId'
    ])

    // Validasyon
    if (!name || name.trim().length === 0) {
      return response.status(400).json({ 
        message: 'Mağaza adı zorunludur' 
      })
    }

    // Slug oluştur (basit versiyon)
    const slug = name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Slug unique mi kontrol et
    const slugExists = await EMarket.findBy('slug', slug)
    if (slugExists) {
      return response.status(400).json({ 
        message: 'Bu mağaza adı zaten kullanılıyor, farklı bir isim deneyin' 
      })
    }

    // Adres kontrolü (opsiyonel)
    if (addressId) {
      const address = await EAddress.find(addressId)
      if (!address || address.userId !== user.id) {
        return response.status(400).json({ 
          message: 'Geçersiz adres' 
        })
      }
    }

    try {
      // Mağaza oluştur
      const market = await EMarket.create({
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        slug: slug,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        addressId: addressId || null,
        isActive: true,
        isVerified: false // Admin onayı bekliyor
      })

      // Kullanıcının rolünü seller yap
      const userRecord = await EUser.find(user.id)
      if (userRecord) {
        userRecord.role = 'seller'
        await userRecord.save()
      }

      // İlişkileri yükle
      await market.load('address')

      return response.status(201).json({
        message: 'Mağaza başarıyla oluşturuldu. Admin onayı bekliyor.',
        data: market
      })
    } catch (error) {
      console.error('Market create error:', error)
      return response.status(500).json({
        message: 'Mağaza oluşturulurken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Kendi mağazamı görüntüle
   * GET /seller/my-market
   */
  public async myMarket({ response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    try {
      const market = await EMarket.query()
        .where('userId', user.id)
        .preload('address')
        .preload('user')
        .first()

      if (!market) {
        return response.status(404).json({ 
          message: 'Mağazanız bulunamadı' 
        })
      }

      return response.json({
        message: 'Mağaza bilgileriniz',
        data: market
      })
    } catch (error) {
      console.error('My market error:', error)
      return response.status(500).json({
        message: 'Mağaza bilgileri alınırken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Mağazamı güncelle
   * POST /seller/my-market/update
   */
  public async updateMyMarket({ request, response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    const market = await EMarket.findBy('userId', user.id)
    if (!market) {
      return response.status(404).json({ 
        message: 'Mağazanız bulunamadı' 
      })
    }

    const { name, description, phone, email, addressId } = request.only([
      'name',
      'description',
      'phone',
      'email',
      'addressId'
    ])

    // Validasyon
    if (name && name.trim().length === 0) {
      return response.status(400).json({ 
        message: 'Mağaza adı boş olamaz' 
      })
    }

    // Adres kontrolü
    if (addressId) {
      const address = await EAddress.find(addressId)
      if (!address || address.userId !== user.id) {
        return response.status(400).json({ 
          message: 'Geçersiz adres' 
        })
      }
    }

    try {
      // İsim değişiyorsa slug'ı da güncelle
      if (name && name !== market.name) {
        const slug = name
          .toLowerCase()
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ı/g, 'i')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')

        // Slug unique mi
        const slugExists = await EMarket.query()
          .where('slug', slug)
          .whereNot('id', market.id)
          .first()

        if (slugExists) {
          return response.status(400).json({ 
            message: 'Bu mağaza adı zaten kullanılıyor' 
          })
        }

        market.name = name.trim()
        market.slug = slug
      }

      if (description !== undefined) market.description = description?.trim() || null
      if (phone !== undefined) market.phone = phone?.trim() || null
      if (email !== undefined) market.email = email?.trim() || null
      if (addressId !== undefined) market.addressId = addressId

      await market.save()
      await market.load('address')

      return response.json({
        message: 'Mağaza bilgileri güncellendi',
        data: market
      })
    } catch (error) {
      console.error('Update market error:', error)
      return response.status(500).json({
        message: 'Mağaza güncellenirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Admin: Tüm mağazaları listele
   * GET /admin/markets
   */
  public async adminIndex({ response }: HttpContext) {
    try {
      const markets = await EMarket.query()
        .preload('user')
        .preload('address')
        .orderBy('id', 'desc')

      return response.json({
        message: 'Mağazalar listelendi',
        data: markets,
        count: markets.length
      })
    } catch (error) {
      console.error('Markets list error:', error)
      return response.status(500).json({
        message: 'Mağazalar listelenirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Admin: Mağaza onayla/reddet
   * POST /admin/markets/:id/verify
   */
  public async verifyMarket({ params, request, response }: HttpContext) {
    const marketId = params.id
    const { isVerified } = request.only(['isVerified'])

    const market = await EMarket.find(marketId)
    if (!market) {
      return response.status(404).json({ 
        message: 'Mağaza bulunamadı' 
      })
    }

    try {
      market.isVerified = isVerified === true
      await market.save()

      return response.json({
        message: `Mağaza ${isVerified ? 'onaylandı' : 'onayı kaldırıldı'}`,
        data: market
      })
    } catch (error) {
      console.error('Verify market error:', error)
      return response.status(500).json({
        message: 'Mağaza durumu güncellenirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Admin: Mağaza aktif/pasif yap
   * POST /admin/markets/:id/toggle-active
   */
  public async toggleActive({ params, response }: HttpContext) {
    const marketId = params.id

    const market = await EMarket.find(marketId)
    if (!market) {
      return response.status(404).json({ 
        message: 'Mağaza bulunamadı' 
      })
    }

    try {
      market.isActive = !market.isActive
      await market.save()

      return response.json({
        message: `Mağaza ${market.isActive ? 'aktif' : 'pasif'} yapıldı`,
        data: market
      })
    } catch (error) {
      console.error('Toggle market error:', error)
      return response.status(500).json({
        message: 'Mağaza durumu güncellenirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Genel: Bir mağazayı görüntüle (slug ile)
   * GET /markets/:slug
   */
  public async showBySlug({ params, response }: HttpContext) {
    const slug = params.slug

    try {
      const market = await EMarket.query()
        .where('slug', slug)
        .where('isActive', true)
        .where('isVerified', true)
        .preload('address')
        .preload('products', (query) => {
          query.where('isActive', true)
        })
        .first()

      if (!market) {
        return response.status(404).json({ 
          message: 'Mağaza bulunamadı' 
        })
      }

      return response.json({
        message: 'Mağaza detayı',
        data: market
      })
    } catch (error) {
      console.error('Show market error:', error)
      return response.status(500).json({
        message: 'Mağaza bilgileri alınırken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Genel: Tüm aktif mağazaları listele
   * GET /markets
   */
  public async publicIndex({ response }: HttpContext) {
    try {
      const markets = await EMarket.query()
        .where('isActive', true)
        .where('isVerified', true)
        .preload('address')
        .orderBy('name', 'asc')

      return response.json({
        message: 'Aktif mağazalar',
        data: markets,
        count: markets.length
      })
    } catch (error) {
      console.error('Public markets list error:', error)
      return response.status(500).json({
        message: 'Mağazalar listelenirken hata oluştu',
        error: String(error)
      })
    }
  }
}