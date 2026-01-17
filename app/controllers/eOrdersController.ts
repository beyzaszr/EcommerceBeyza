import type { HttpContext } from '@adonisjs/core/http'
import EOrder from '#models/e_order'
import EOrderItem from '#models/e_order_item'
import EProduct from '#models/e_product'
import EAddress from '#models/e_address'
import EMarket from '#models/e_market'
import db from '@adonisjs/lucid/services/db'

export default class EOrdersController {
  /**
   * Admin: Tüm siparişleri listele
   * GET /admin/orders
   */
  public async E_index({ response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    try {
      const query = EOrder.query()
        .whereNot('status', 'cart')  // Sepetleri hariç tut
        .preload('user')
        .preload('address')
        .preload('items', (itemQuery) => {
          itemQuery.preload('product')
          itemQuery.preload('market')
        })
        .orderBy('id', 'desc')

      // Seller sadece kendi mağazasının siparişlerini görebilir
      if (user.role === 'seller') {
        const market = await EMarket.findBy('userId', user.id)
        if (!market) {
          return response.json({
            message: 'Mağazanız bulunamadı',
            data: [],
            count: 0
          })
        }

        // Sadece bu mağazaya ait ürünleri içeren siparişleri getir
        query.whereHas('items', (itemQuery) => {
          itemQuery.where('marketId', market.id)
        })
      }

      const orders = await query
      
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
   * Sipariş detayı görüntüle (admin, seller veya sipariş sahibi)
   * GET /customer/orders/:id veya /admin/orders/:id veya /seller/orders/:id
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
          query.preload('market')
        })
        .first()

      if (!order) {
        return response.status(404).json({ 
          message: 'Sipariş bulunamadı' 
        })
      }

      // Yetki kontrolü
      if (user.role === 'admin') {
        // Admin her şeyi görebilir
      } else if (user.role === 'seller') {
        // Seller sadece kendi mağazasının ürünlerini içeren siparişleri görebilir
        const market = await EMarket.findBy('userId', user.id)
        if (!market) {
          return response.status(403).json({ 
            message: 'Mağazanız bulunamadı' 
          })
        }

        // Siparişte bu mağazaya ait ürün var mı kontrol et
        const hasMarketItem = order.items.some(item => item.marketId === market.id)
        if (!hasMarketItem) {
          return response.status(403).json({ 
            message: 'Bu siparişi görüntüleme yetkiniz yok' 
          })
        }

        // ✅ Seller için sadece kendi mağazasının ürünlerini filtrele
        // items'ı serialize ederken filtreleme yap
        const filteredItems = order.items.filter(item => item.marketId === market.id)
        
        return response.json({
          message: 'Sipariş detayı getirildi',
          data: {
            ...order.toJSON(),
            items: filteredItems
          }
        })
      } else if (user.role === 'customer') {
        // Customer sadece kendi siparişini görebilir
        if (user.id !== order.userId) {
          return response.status(403).json({ 
            message: 'Bu siparişi görüntüleme yetkiniz yok' 
          })
        }
      } else {
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
          query.preload('market')
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
   * Admin veya Seller: Sipariş durumunu güncelle
   * POST /admin/orders/:id/update-status veya /seller/orders/:id/update-status
   */
  public async updateStatus({ params, request, response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    // Yetki kontrolü
    if (!user || (user.role !== 'admin' && user.role !== 'seller')) {
      return response.status(403).json({ 
        message: 'Admin veya Seller yetkisi gerekli' 
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
      const order = await EOrder.query()
        .where('id', orderId)
        .preload('items')
        .first()

      if (!order) {
        return response.status(404).json({ 
          message: 'Sipariş bulunamadı' 
        })
      }

      // Seller için ek kontrol
      if (user.role === 'seller') {
        const market = await EMarket.findBy('userId', user.id)
        if (!market) {
          return response.status(403).json({ 
            message: 'Mağazanız bulunamadı' 
          })
        }

        // Siparişte bu mağazaya ait ürün var mı kontrol et
        const hasMarketItem = order.items.some(item => item.marketId === market.id)
        if (!hasMarketItem) {
          return response.status(403).json({ 
            message: 'Bu siparişin durumunu güncelleme yetkiniz yok' 
          })
        }

        // Seller sadece belirli durumları güncelleyebilir
        const sellerAllowedStatuses = ['shipped']
        if (!sellerAllowedStatuses.includes(status)) {
          return response.status(403).json({ 
            message: 'Seller sadece siparişi "shipped" (kargoya verildi) durumuna geçirebilir' 
          })
        }
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
        query.preload('market')
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

  /**
   * Seller: Kendi mağazasının siparişlerini listele
   * GET /seller/orders
   */
  public async sellerOrders({ response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    if (user.role !== 'seller') {
      return response.status(403).json({ 
        message: 'Seller yetkisi gerekli' 
      })
    }

    try {
      const market = await EMarket.findBy('userId', user.id)
      if (!market) {
        return response.json({
          message: 'Mağazanız bulunamadı',
          data: [],
          count: 0
        })
      }

      // Sadece bu mağazaya ait ürünleri içeren siparişleri getir
      const orders = await EOrder.query()
        .whereNot('status', 'cart')
        .whereHas('items', (itemQuery) => {
          itemQuery.where('marketId', market.id)
        })
        .preload('user')
        .preload('address')
        .preload('items', (itemQuery) => {
          itemQuery.where('marketId', market.id)
          itemQuery.preload('product')
          itemQuery.preload('market')
        })
        .orderBy('id', 'desc')

      return response.json({
        message: 'Mağazanızın siparişleri',
        data: orders,
        count: orders.length
      })
    } catch (error) {
      console.error('Seller orders error:', error)
      return response.status(500).json({
        message: 'Siparişler listelenirken hata oluştu',
        error: String(error)
      })
    }
  }
}