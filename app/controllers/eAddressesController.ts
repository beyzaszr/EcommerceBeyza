import type { HttpContext } from '@adonisjs/core/http'
import EAddress from '#models/e_address'

export default class EAddressesController {
  /**
   * Kullanıcının tüm adreslerini listele
   * GET /customer/addresses
   */
  public async index({ response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    try {
      const addresses = await EAddress.query()
        .where('userId', user.id)
        .orderBy('isDefault', 'desc')
        .orderBy('id', 'desc')

      return response.json({
        message: 'Adresler listelendi',
        data: addresses,
        count: addresses.length
      })
    } catch (error) {
      console.error('Addresses list error:', error)
      return response.status(500).json({
        message: 'Adresler listelenirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Tek bir adresi görüntüle
   * GET /customer/addresses/:id
   */
  public async show({ params, response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    const addressId = params.id

    try {
      const address = await EAddress.query()
        .where('id', addressId)
        .where('userId', user.id)
        .first()

      if (!address) {
        return response.status(404).json({ 
          message: 'Adres bulunamadı' 
        })
      }

      return response.json({
        message: 'Adres getirildi',
        data: address
      })
    } catch (error) {
      console.error('Address show error:', error)
      return response.status(500).json({
        message: 'Adres getirilirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Yeni adres oluştur
   * POST /customer/addresses
   */
  public async store({ request, response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    const { title, city, district, fullAddress, isDefault } = request.only([
      'title',
      'city',
      'district',
      'fullAddress',
      'isDefault'
    ])

    // Validasyon
    if (!title || title.trim().length === 0) {
      return response.status(400).json({ 
        message: 'Adres başlığı zorunludur' 
      })
    }

    if (!city || city.trim().length === 0) {
      return response.status(400).json({ 
        message: 'Şehir zorunludur' 
      })
    }

    if (!district || district.trim().length === 0) {
      return response.status(400).json({ 
        message: 'İlçe zorunludur' 
      })
    }

    if (!fullAddress || fullAddress.trim().length === 0) {
      return response.status(400).json({ 
        message: 'Adres detayı zorunludur' 
      })
    }

    try {
      // Eğer bu ilk adres ise veya isDefault true ise, diğer adresleri false yap
      if (isDefault === true) {
        await EAddress.query()
          .where('userId', user.id)
          .update({ isDefault: false })
      }

      // Kullanıcının hiç adresi yoksa, ilk adres otomatik default olsun
      const addressCount = await EAddress.query()
        .where('userId', user.id)
        .count('* as total')
      
      const isFirstAddress = addressCount[0].$extras.total === 0

      const address = await EAddress.create({
        userId: user.id,
        title: title.trim(),
        city: city.trim(),
        district: district.trim(),
        fullAddress: fullAddress.trim(),
        isDefault: isDefault === true || isFirstAddress
      })

      return response.status(201).json({
        message: 'Adres başarıyla oluşturuldu',
        data: address
      })
    } catch (error) {
      console.error('Address create error:', error)
      return response.status(500).json({
        message: 'Adres oluşturulurken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Adresi güncelle
   * POST /customer/addresses/:id
   */
  public async update({ params, request, response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    const addressId = params.id

    const address = await EAddress.query()
      .where('id', addressId)
      .where('userId', user.id)
      .first()

    if (!address) {
      return response.status(404).json({ 
        message: 'Adres bulunamadı' 
      })
    }

    const { title, city, district, fullAddress, isDefault } = request.only([
      'title',
      'city',
      'district',
      'fullAddress',
      'isDefault'
    ])

    // Validasyon
    if (title && title.trim().length === 0) {
      return response.status(400).json({ 
        message: 'Adres başlığı boş olamaz' 
      })
    }

    if (city && city.trim().length === 0) {
      return response.status(400).json({ 
        message: 'Şehir boş olamaz' 
      })
    }

    if (district && district.trim().length === 0) {
      return response.status(400).json({ 
        message: 'İlçe boş olamaz' 
      })
    }

    if (fullAddress && fullAddress.trim().length === 0) {
      return response.status(400).json({ 
        message: 'Adres detayı boş olamaz' 
      })
    }

    try {
      // Eğer isDefault true yapılıyorsa, diğer adresleri false yap
      if (isDefault === true && !address.isDefault) {
        await EAddress.query()
          .where('userId', user.id)
          .whereNot('id', addressId)
          .update({ isDefault: false })
      }

      // Güncelle
      if (title) address.title = title.trim()
      if (city) address.city = city.trim()
      if (district) address.district = district.trim()
      if (fullAddress) address.fullAddress = fullAddress.trim()
      if (isDefault !== undefined) address.isDefault = isDefault

      await address.save()

      return response.json({
        message: 'Adres başarıyla güncellendi',
        data: address
      })
    } catch (error) {
      console.error('Address update error:', error)
      return response.status(500).json({
        message: 'Adres güncellenirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Adresi varsayılan yap
   * POST /customer/addresses/:id/set-default
   */
  public async setDefault({ params, response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    const addressId = params.id

    try {
      const address = await EAddress.query()
        .where('id', addressId)
        .where('userId', user.id)
        .first()

      if (!address) {
        return response.status(404).json({ 
          message: 'Adres bulunamadı' 
        })
      }

      // Tüm adresleri false yap
      await EAddress.query()
        .where('userId', user.id)
        .update({ isDefault: false })

      // Bu adresi true yap
      address.isDefault = true
      await address.save()

      return response.json({
        message: 'Varsayılan adres güncellendi',
        data: address
      })
    } catch (error) {
      console.error('Set default address error:', error)
      return response.status(500).json({
        message: 'Varsayılan adres güncellenirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Adresi sil
   * DELETE /customer/addresses/:id
   */
  public async destroy({ params, response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    const addressId = params.id

    try {
      const address = await EAddress.query()
        .where('id', addressId)
        .where('userId', user.id)
        .first()

      if (!address) {
        return response.status(404).json({ 
          message: 'Adres bulunamadı' 
        })
      }

      // Bu adres siparişlerde kullanılmış mı kontrol et
      await address.load('orders')
      if (address.orders.length > 0) {
        return response.status(400).json({ 
          message: 'Bu adres siparişlerde kullanılmış. Silinemez' 
        })
      }

      const wasDefault = address.isDefault
      await address.delete()

      // Eğer silinen adres default ise, başka bir adresi default yap
      if (wasDefault) {
        const firstAddress = await EAddress.query()
          .where('userId', user.id)
          .first()

        if (firstAddress) {
          firstAddress.isDefault = true
          await firstAddress.save()
        }
      }

      return response.json({
        message: 'Adres başarıyla silindi'
      })
    } catch (error) {
      console.error('Address delete error:', error)
      return response.status(500).json({
        message: 'Adres silinirken hata oluştu',
        error: String(error)
      })
    }
  }
}