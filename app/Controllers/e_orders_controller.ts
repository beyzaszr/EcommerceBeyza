import type { HttpContext } from '@adonisjs/core/http'
import EOrder from '#models/e_order'
import EOrderItem from '#models/e_order_item'
import EProduct from '#models/e_product'
import EAddress from '#models/e_address'
import db from '@adonisjs/lucid/services/db'

export default class EOrdersController {
  /**
   * Admin: Tüm siparişleri listele
   * GET /admin/orders
   */
  public async E_index({ response }: HttpContext) {
    try {
      const orders = await EOrder.query()
        .whereNot('status', 'cart')  // Sepetleri hariç tut
        .preload('user')
        .preload('address')
        .preload('items', (query) => {
          query.preload('product')
        })
        .orderBy('id', 'desc')
      
      return response.json({
        message: 'Siparişler listelendi',
        data: orders,
        count: orders.length
      })
    } catch (error) {
      console.error('Orders list error:', error)
      return response.status(500).json({
        message: 'Siparişler listelenirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Sipariş detayı görüntüle (admin veya sipariş sahibi)
   * GET /customer/orders/:id veya /admin/orders/:id
   */
  public async show({ params, response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    // Authentication kontrolü
    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    // URL parametresinden sipariş id'sini al
    const orderId = params.id

    try {
      // Siparişi bul
      const order = await EOrder.query()
        .where('id', orderId)
        .preload('user')
        .preload('address')
        .preload('items', (query) => {
          query.preload('product')
        })
        .first()

      if (!order) {
        return response.status(404).json({ 
          message: 'Sipariş bulunamadı' 
        })
      }

      // Yetki kontrolü: admin veya sipariş sahibi
      if (user.role !== 'admin' && user.id !== order.userId) {
        return response.status(403).json({ 
          message: 'Bu siparişi görüntüleme yetkiniz yok' 
        })
      }

      return response.json({
        message: 'Sipariş detayı getirildi',
        data: order
      })
    } catch (error) {
      console.error('Order show error:', error)
      return response.status(500).json({
        message: 'Sipariş detayı getirilirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Customer: Yeni sipariş oluştur
   * POST /customer/orders
   */
  // public async store({ request, response }: HttpContext & { user?: any }) {
  //   const ctx = arguments[0] as any
  //   const user = ctx.user

  //   // Authentication kontrolü
  //   if (!user) {
  //     return response.status(401).json({ 
  //       message: 'Oturum bulunamadı' 
  //     })
  //   }

  //   // Request verilerini al
  //   const { addressId, items } = request.only(['addressId', 'items'])

  //   // Validasyon: Sipariş öğeleri kontrolü
  //   if (!items || !Array.isArray(items) || items.length === 0) {
  //     return response.status(400).json({ 
  //       message: 'Sipariş öğeleri gerekli ve en az 1 ürün içermelidir' 
  //     })
  //   }

  //   // Validasyon: Adres kontrolü
  //   if (!addressId) {
  //     return response.status(400).json({ 
  //       message: 'Teslimat adresi seçilmelidir' 
  //     })
  //   }

  //   try {
  //     // Adresi bul ve kullanıcıya ait mi kontrol et
  //     const address = await EAddress.find(addressId)
  //     if (!address) {
  //       return response.status(404).json({ 
  //         message: 'Seçilen adres bulunamadı' 
  //       })
  //     }

  //     if (address.userId !== user.id) {
  //       return response.status(403).json({ 
  //         message: 'Bu adres size ait değil' 
  //       })
  //     }

  //     // Sipariş öğelerini doğrula ve toplam fiyat hesapla
  //     let totalPrice = 0
  //     const validatedOrderItems: Array<{
  //       productId: number
  //       quantity: number
  //       unitPrice: number
  //       totalPrice: number
  //     }> = []

  //     for (const item of items) {
  //       // Item validasyonu
  //       if (!item.productId || !item.quantity) {
  //         return response.status(400).json({ 
  //           message: 'Her ürün için productId ve quantity gereklidir' 
  //         })
  //       }

  //       if (item.quantity <= 0) {
  //         return response.status(400).json({ 
  //           message: 'Ürün adedi 0\'dan büyük olmalıdır' 
  //         })
  //       }

  //       // Ürünü bul
  //       const product = await EProduct.find(item.productId)
  //       if (!product) {
  //         return response.status(404).json({ 
  //           message: `Ürün bulunamadı (ID: ${item.productId})` 
  //         })
  //       }

  //       // Ürün aktif mi kontrol et
  //       if (!product.isActive) {
  //         return response.status(400).json({ 
  //           message: `${product.name} şu an satışta değil` 
  //         })
  //       }

  //       // Stok kontrolü
  //       if (product.stock < item.quantity) {
  //         return response.status(400).json({ 
  //           message: `${product.name} için yeterli stok yok. Mevcut stok: ${product.stock}, istenen: ${item.quantity}` 
  //         })
  //       }

  //       // Fiyat hesapla
  //       const itemTotalPrice = product.price * item.quantity
  //       totalPrice += itemTotalPrice

  //       validatedOrderItems.push({
  //         productId: product.id,
  //         quantity: parseInt(item.quantity),
  //         unitPrice: product.price,
  //         totalPrice: itemTotalPrice
  //       })
  //     }

  //     // Transaction ile sipariş oluştur (atomik işlem)
  //     const order = await db.transaction(async (trx) => {
  //       // 1. Siparişi oluştur
  //       const newOrder = await EOrder.create({
  //         userId: user.id,
  //         addressId: addressId,
  //         totalPrice: totalPrice,
  //         status: 'pending'
  //       }, { client: trx })

  //       // 2. Sipariş öğelerini ekle ve stokları güncelle
  //       for (const item of validatedOrderItems) {
  //         // Sipariş öğesini oluştur
  //         await EOrderItem.create({
  //           orderId: newOrder.id,
  //           productId: item.productId,
  //           quantity: item.quantity,
  //           unitPrice: item.unitPrice,
  //           totalPrice: item.totalPrice
  //         }, { client: trx })

  //         // Stok güncelle
  //         const product = await EProduct.find(item.productId, { client: trx })
  //         if (product) {
  //           product.stock -= item.quantity
  //           await product.save({ client: trx })
  //         }
  //       }

  //       return newOrder
  //     })

  //     // Sipariş detaylarını yükle
  //     // order -> items -> product
  //     // items tablosundan bu order'a ait olanları bul getir.#controllers
  //     // her bir item içinde product var, her biri içinde o product'ı getir


  //     await order.load('items', (query) => {
  //       query.preload('product')
  //     })

  //     await order.load('address')

  //     return response.status(201).json({
  //       message: 'Sipariş başarıyla oluşturuldu',
  //       data: order
  //     })
  //   } catch (error) {
  //     console.error('Order create error:', error)
  //     return response.status(500).json({
  //       message: 'Sipariş oluşturulurken hata oluştu',
  //       error: String(error)
  //     })
  //   }
  // }

  /**
   * Customer: Kendi siparişlerini listele
   * GET /customer/orders
   */
  public async myOrders({ response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    // Authentication kontrolü
    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    try {
      const orders = await EOrder.query()
        .where('userId', user.id)
        .whereNot('status', 'cart')  // Sepetleri hariç tut
        .preload('address')
        .preload('items', (query) => {
          query.preload('product')
        })
        .orderBy('id', 'desc')

      return response.json({
        message: 'Siparişleriniz listelendi',
        data: orders,
        count: orders.length
      })
    } catch (error) {
      console.error('My orders list error:', error)
      return response.status(500).json({
        message: 'Siparişler listelenirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Admin: Sipariş durumunu güncelle
   * POST /admin/orders/:id/update-status
   */
  public async updateStatus({ params, request, response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    // Admin kontrolü
    if (!user || user.role !== 'admin') {
      return response.status(403).json({ 
        message: 'Admin yetkisi gerekli' 
      })
    }

    // URL parametresinden sipariş id'sini al
    const orderId = params.id

    // Request'ten yeni durumu al
    const { status } = request.only(['status'])

    // Validasyon: Durum kontrolü
    const validStatuses = ['pending', 'paid', 'canceled', 'shipped']
    if (!status) {
      return response.status(400).json({ 
        message: 'Durum bilgisi gerekli' 
      })
    }

    if (!validStatuses.includes(status)) {
      return response.status(400).json({ 
        message: `Geçersiz durum. Geçerli değerler: ${validStatuses.join(', ')}` 
      })
    }

    try {
      // Siparişi bul
      const order = await EOrder.find(orderId)
      if (!order) {
        return response.status(404).json({ 
          message: 'Sipariş bulunamadı' 
        })
      }

      // Durumu güncelle
      const oldStatus = order.status
      order.status = status
      await order.save()

      // İlişkileri yükle
      await order.load('user')
      await order.load('address')
      await order.load('items', (query) => {
        query.preload('product')
      })

      return response.json({
        message: `Sipariş durumu güncellendi: ${oldStatus} → ${status}`,
        data: order
      })
    } catch (error) {
      console.error('Order status update error:', error)
      return response.status(500).json({
        message: 'Sipariş durumu güncellenirken hata oluştu',
        error: String(error)
      })
    }
  }
}