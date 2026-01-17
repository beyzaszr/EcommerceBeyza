import type { HttpContext } from '@adonisjs/core/http'
import EOrder from '#models/e_order'
import EOrderItem from '#models/e_order_item'
import EProduct from '#models/e_product'
import EAddress from '#models/e_address'
//import EMarket from '#models/e_market'
import db from '@adonisjs/lucid/services/db'

export default class ECartsController {
  /**
   * Sepeti görüntüle (status='cart' olan order)
   * GET /customer/cart
   */
  public async show({ response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    try {
      // Kullanıcının 'cart' durumundaki siparişini bul
      let cart = await EOrder.query()
        .where('userId', user.id)
        .where('status', 'cart')
        .preload('items', (query) => {
          query.preload('product')
        })
        .first()

      if (!cart) {
        // Sepet yoksa boş sepet döndür
        return response.json({
          message: 'Sepetiniz boş',
          data: {
            id: null,
            userId: user.id,
            totalPrice: 0,
            status: 'cart',
            items: []
          }
        })
      }

      return response.json({
        message: 'Sepet getirildi',
        data: cart
      })
    } catch (error) {
      console.error('Cart show error:', error)
      return response.status(500).json({
        message: 'Sepet getirilirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Sepete ürün ekle
   * POST /customer/cart/add
   */
  public async addItem({ request, response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    const { productId, quantity } = request.only(['productId', 'quantity'])

    // Validasyon
    if (!productId) {
      return response.status(400).json({ 
        message: 'Ürün ID gerekli' 
      })
    }

    if (!quantity || quantity <= 0) {
      return response.status(400).json({ 
        message: 'Geçerli bir adet giriniz' 
      })
    }

    try {
      // Ürünü bul
      const product = await EProduct.find(productId)
      if (!product) {
        return response.status(404).json({ 
          message: 'Ürün bulunamadı' 
        })
      }

      // Ürün aktif mi
      if (!product.isActive) {
        return response.status(400).json({ 
          message: 'Bu ürün şu an satışta değil' 
        })
      }

      // Stok kontrolü
      if (product.stock < quantity) {
        return response.status(400).json({ 
          message: `Yetersiz stok. Mevcut stok: ${product.stock}` 
        })
      }

      // Kullanıcının sepetini bul veya oluştur (status='cart' olan order)
      let cart = await EOrder.query()
        .where('userId', user.id)
        .where('status', 'cart')
        .first()

      if (!cart) {
        // Sepet yoksa yeni oluştur
        cart = await EOrder.create({
          userId: user.id,
          addressId: null,
          totalPrice: 0,
          status: 'cart'
        })
      }

      // Sepette bu ürün var mı kontrol et
      let cartItem = await EOrderItem.query()
        .where('orderId', cart.id)
        .where('productId', productId)
        .first()

      if (cartItem) {
        // Varsa miktarı artır
        const newQuantity = cartItem.quantity + parseInt(quantity)
        
        // Stok kontrolü
        if (product.stock < newQuantity) {
          return response.status(400).json({ 
            message: `Yetersiz stok. Mevcut stok: ${product.stock}, sepette: ${cartItem.quantity}` 
          })
        }

        cartItem.quantity = newQuantity
        cartItem.totalPrice = cartItem.unitPrice * newQuantity
        await cartItem.save()
      } else {
        // Yoksa yeni ekle
        cartItem = await EOrderItem.create({
          orderId: cart.id,
          productId: product.id,
          quantity: parseInt(quantity),
          unitPrice: product.price,
          totalPrice: product.price * parseInt(quantity),
          marketId: product.marketId
        })
      }

      // Sepet toplam fiyatını güncelle
      await this.updateCartTotal(cart.id)

      // Güncel sepeti yükle
      await cart.load('items', (query) => {
        query.preload('product')
      })

      return response.json({
        message: 'Ürün sepete eklendi',
        data: cart
      })
    } catch (error) {
      console.error('Add to cart error:', error)
      return response.status(500).json({
        message: 'Ürün sepete eklenirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Sepet ürün miktarını güncelle
   * POST /customer/cart/update
   */
  public async updateItem({ request, response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    const { itemId, quantity } = request.only(['itemId', 'quantity'])

    if (!itemId) {
      return response.status(400).json({ 
        message: 'Ürün ID gerekli' 
      })
    }

    if (!quantity || quantity <= 0) {
      return response.status(400).json({ 
        message: 'Geçerli bir adet giriniz' 
      })
    }

    try {
      // Sepet ürününü bul
      const cartItem = await EOrderItem.query()
        .where('id', itemId)
        .preload('order')
        .preload('product')
        .first()

      if (!cartItem) {
        return response.status(404).json({ 
          message: 'Sepet ürünü bulunamadı' 
        })
      }

      // Sepet kontrolü
      if (cartItem.order.status !== 'cart') {
        return response.status(400).json({ 
          message: 'Bu ürün artık sepette değil' 
        })
      }

      // Sepet kullanıcıya ait mi
      if (cartItem.order.userId !== user.id) {
        return response.status(403).json({ 
          message: 'Bu sepete erişim yetkiniz yok' 
        })
      }

      // Stok kontrolü
      if (cartItem.product.stock < quantity) {
        return response.status(400).json({ 
          message: `Yetersiz stok. Mevcut stok: ${cartItem.product.stock}` 
        })
      }

      // Miktarı güncelle
      cartItem.quantity = parseInt(quantity)
      cartItem.totalPrice = cartItem.unitPrice * parseInt(quantity)
      await cartItem.save()

      // Sepet toplamını güncelle
      await this.updateCartTotal(cartItem.orderId)

      // Güncel sepeti yükle
      const cart = await EOrder.query()
        .where('id', cartItem.orderId)
        .preload('items', (query) => {
          query.preload('product')
        })
        .first()

      return response.json({
        message: 'Sepet güncellendi',
        data: cart
      })
    } catch (error) {
      console.error('Update cart error:', error)
      return response.status(500).json({
        message: 'Sepet güncellenirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Sepetten ürün sil
   * DELETE /customer/cart/remove/:itemId
   */
  public async removeItem({ params, response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    const itemId = params.itemId

    try {
      const cartItem = await EOrderItem.query()
        .where('id', itemId)
        .preload('order')
        .first()

      if (!cartItem) {
        return response.status(404).json({ 
          message: 'Sepet ürünü bulunamadı' 
        })
      }

      // Sepet kontrolü
      if (cartItem.order.status !== 'cart') {
        return response.status(400).json({ 
          message: 'Bu ürün artık sepette değil' 
        })
      }

      // Sepet kullanıcıya ait mi
      if (cartItem.order.userId !== user.id) {
        return response.status(403).json({ 
          message: 'Bu sepete erişim yetkiniz yok' 
        })
      }

      const orderId = cartItem.orderId
      await cartItem.delete()

      // Sepet toplamını güncelle
      await this.updateCartTotal(orderId)

      // Güncel sepeti yükle
      const cart = await EOrder.query()
        .where('id', orderId)
        .preload('items', (query) => {
          query.preload('product')
        })
        .first()

      return response.json({
        message: 'Ürün sepetten çıkarıldı',
        data: cart
      })
    } catch (error) {
      console.error('Remove from cart error:', error)
      return response.status(500).json({
        message: 'Ürün sepetten çıkarılırken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Sepeti tamamen temizle
   * DELETE /customer/cart/clear
   */
  public async clear({ response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    try {
      const cart = await EOrder.query()
        .where('userId', user.id)
        .where('status', 'cart')
        .first()

      if (!cart) {
        return response.json({
          message: 'Sepetiniz zaten boş'
        })
      }

      // Tüm sepet ürünlerini sil
      await EOrderItem.query()
        .where('orderId', cart.id)
        .delete()

      // Sepet toplamını sıfırla
      cart.totalPrice = 0
      await cart.save()

      return response.json({
        message: 'Sepet temizlendi',
        data: {
          id: cart.id,
          userId: user.id,
          totalPrice: 0,
          status: 'cart',
          items: []
        }
      })
    } catch (error) {
      console.error('Clear cart error:', error)
      return response.status(500).json({
        message: 'Sepet temizlenirken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Sepeti siparişe dönüştür (checkout) - Sepet status'ü 'cart'tan 'pending'e döner
   * POST /customer/cart/checkout
   */
//   public async checkout({ request, response }: HttpContext & { user?: any }) {
//     const ctx = arguments[0] as any
//     const user = ctx.user

//     if (!user) {
//       return response.status(401).json({ 
//         message: 'Oturum bulunamadı' 
//       })
//     }

//     const { addressId } = request.only(['addressId'])

//     if (!addressId) {
//       return response.status(400).json({ 
//         message: 'Teslimat adresi seçilmelidir' 
//       })
//     }

//     try {
//       // Adresi kontrol et
//       const address = await EAddress.find(addressId)
//       if (!address) {
//         return response.status(404).json({ 
//           message: 'Seçilen adres bulunamadı' 
//         })
//       }

//       if (address.userId !== user.id) {
//         return response.status(403).json({ 
//           message: 'Bu adres size ait değil' 
//         })
//       }

//       // Sepeti bul
//       const cart = await EOrder.query()
//         .where('userId', user.id)
//         .where('status', 'cart')
//         .preload('items', (query) => {
//           query.preload('product')
//         })
//         .first()

//       if (!cart || cart.items.length === 0) {
//         return response.status(400).json({ 
//           message: 'Sepetiniz boş' 
//         })
//       }

//       // Transaction ile sipariş oluştur
//       const order = await db.transaction(async (trx) => {
//         // Stok kontrolleri ve fiyat güncellemeleri
//         for (const item of cart.items) {
//           const product = item.product

//           // Ürün aktif mi
//           if (!product.isActive) {
//             throw new Error(`${product.name} artık satışta değil`)
//           }

//           // Stok yeterli mi
//           if (product.stock < item.quantity) {
//             throw new Error(`${product.name} için yetersiz stok. Mevcut: ${product.stock}, istenen: ${item.quantity}`)
//           }

//           // Fiyat değişmiş mi kontrol et ve güncelle
//           if (product.price !== item.unitPrice) {
//             item.unitPrice = product.price
//             item.totalPrice = product.price * item.quantity
//             await item.save({ client: trx })
//           }

//           // Stok güncelle
//           product.stock -= item.quantity
//           await product.save({ client: trx })
//         }

//         // Sepet toplamını yeniden hesapla
//         await this.updateCartTotal(cart.id, trx)
//         await cart.refresh()

//         // Sepeti siparişe dönüştür: status'ü 'cart'tan 'pending'e çevir
//         cart.status = 'pending'
//         cart.addressId = addressId
//         await cart.save({ client: trx })

//         return cart
//       })

//       // Sipariş detaylarını yükle
//       await order.load('items', (query) => {
//         query.preload('product')
//       })
//       await order.load('address')
//       await order.load('user')

//       return response.status(201).json({
//         message: 'Sipariş başarıyla oluşturuldu',
//         data: order
//       })
//     } catch (error) {
//       console.error('Checkout error:', error)
//       return response.status(500).json({
//         message: error.message || 'Sipariş oluşturulurken hata oluştu',
//         error: String(error)
//       })
//     }
//   }
  public async checkout({ request, response }: HttpContext & { user?: any }) {
    const ctx = arguments[0] as any
    const user = ctx.user

    if (!user) {
      return response.status(401).json({ 
        message: 'Oturum bulunamadı' 
      })
    }

    const { addressId } = request.only(['addressId'])

    if (!addressId) {
      return response.status(400).json({ 
        message: 'Teslimat adresi seçilmelidir' 
      })
    }

    try {
      // Adresi kontrol et
      const address = await EAddress.find(addressId)
      if (!address) {
        return response.status(404).json({ 
          message: 'Seçilen adres bulunamadı' 
        })
      }

      if (address.userId !== user.id) {
        return response.status(403).json({ 
          message: 'Bu adres size ait değil' 
        })
      }

      // Sepeti bul
      const cart = await EOrder.query()
        .where('userId', user.id)
        .where('status', 'cart')
        .preload('items', (query) => {
          query.preload('product')
        })
        .first()

      if (!cart || cart.items.length === 0) {
        return response.status(400).json({ 
          message: 'Sepetiniz boş' 
        })
      }

      // Transaction ile sipariş oluştur
      const order = await db.transaction(async (trx) => {
        // Stok kontrolleri ve fiyat güncellemeleri
        for (const item of cart.items) {
          // Ürünü transaction içinde tekrar bul (lock için)
          const product = await EProduct.query({ client: trx })
            .where('id', item.productId)
            .forUpdate() // Row-level lock
            .first()

          if (!product) {
            throw new Error(`Ürün bulunamadı: ${item.productId}`)
          }

          // Ürün aktif mi
          if (!product.isActive) {
            throw new Error(`${product.name} artık satışta değil`)
          }

          // Stok yeterli mi
          if (product.stock < item.quantity) {
            throw new Error(`${product.name} için yetersiz stok. Mevcut: ${product.stock}, istenen: ${item.quantity}`)
          }

         // Fiyat değişmiş mi kontrol et ve güncelle
        const currentPrice = parseFloat(product.price.toString())
        const itemPrice = parseFloat(item.unitPrice.toString())
        
        if (Math.abs(currentPrice - itemPrice) > 0.01) {
          const orderItem = await EOrderItem.query({ client: trx })
            .where('id', item.id)
            .first()
          
          if (orderItem) {
            orderItem.unitPrice = currentPrice
            orderItem.totalPrice = parseFloat((currentPrice * item.quantity).toFixed(2))
            await orderItem.save()
          }
        }

          // ✅ marketId'nin doğru olduğundan emin ol
        // Eğer sepete eklerken marketId kaydedilmemişse burada güncelle
        if (item.marketId !== product.marketId) {
          const orderItem = await EOrderItem.query({ client: trx })
            .where('id', item.id)
            .first()
          
          if (orderItem) {
            orderItem.marketId = product.marketId
            await orderItem.save()
          }
        }

          // Stok güncelle
          product.stock -= item.quantity
          await product.save()
        }

    // ✅ Sepet toplamını yeniden hesapla - DÜZELTİLMİŞ VERSİYON
      const items = await EOrderItem.query({ client: trx })
        .where('orderId', cart.id)

      // Her item'ın totalPrice'ını kesinlikle number'a çevir
      let total = 0
      for (const item of items) {
        const itemPrice = parseFloat(item.totalPrice.toString())
        if (!isNaN(itemPrice)) {
          total += itemPrice
        }
      }

      // Toplamı 2 ondalık basamağa yuvarla
      const finalTotal = parseFloat(total.toFixed(2))

      // Sepeti siparişe dönüştür
      const orderToUpdate = await EOrder.query({ client: trx })
        .where('id', cart.id)
        .first()

      if (!orderToUpdate) {
        throw new Error('Sepet bulunamadı')
      }

      orderToUpdate.status = 'pending'
      orderToUpdate.addressId = addressId
      orderToUpdate.totalPrice = finalTotal
      await orderToUpdate.save()

      return orderToUpdate
    })

      // Sipariş detaylarını yükle
      await order.load('items', (query) => {
        query.preload('product').preload('market')
      })
      await order.load('address')
      await order.load('user')

      return response.status(201).json({
        message: 'Sipariş başarıyla oluşturuldu',
        data: order
      })
    } catch (error) {
      console.error('Checkout error:', error)
      return response.status(500).json({
        message: error.message || 'Sipariş oluşturulurken hata oluştu',
        error: String(error)
      })
    }
  }

  /**
   * Sepet toplam fiyatını güncelle (yardımcı metod)
   */
  private async updateCartTotal(orderId: number, trx?: any) {
    const items = await EOrderItem.query(trx ? { client: trx } : {})
      .where('orderId', orderId)

    // ✅ Her item'ı kesinlikle number'a çevir ve topla
    let total = 0
    for (const item of items) {
      const itemPrice = parseFloat(item.totalPrice.toString())
      if (!isNaN(itemPrice)) {
        total += itemPrice
      }
    }

    const cart = await EOrder.find(orderId, trx ? { client: trx } : {})
    if (cart) {
      cart.totalPrice = parseFloat(total.toFixed(2))
      await cart.save(trx ? { client: trx } : {})
    }
  }
}