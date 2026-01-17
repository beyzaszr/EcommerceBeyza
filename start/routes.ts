/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

// import TestController from '#controllers/Http/TestController'
// import UsersController from '#controllers/users_controller'
// import TestTaskController from '#controllers/Http/TestTaskController'
// import TasksController from '#controllers/tasks_controller'
// import TasksControllerV2 from '#controllers/tasks_controller_v2'
import AuthController from '#controllers/authController'
import router from '@adonisjs/core/services/router'
//e ticaret için oluşturuldu
import ECategoriesController from '#controllers/eCategoriesController'
import EProductsController from '#controllers/eProductsController'
import EOrdersController from '#controllers/eOrdersController'
import ECartsController from '#controllers/eCartsController'
import EAddressesController from '#controllers/eAddressesController'
import EMarketsController from '#controllers/eMarketsController'
import {middleware} from '#start/kernel' 

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// router.get('/test-user', [TestController, 'show'])
// router.post('/registerUser', [UsersController, 'registerUser'])
// router.post('/login', [UsersController, 'login'])

// router.get('/test-task', [TestTaskController, 'show'])
// router.post('/set-task', [TasksController, 'setTask'])

// //router.get('/get-tasks', [TasksController, 'index'])
// router.post('/set-tasks', [TasksController, 'store'])
// router.post('/update-tasks/:id', [TasksController, 'update'])
// router.delete('/tasks/:id', [TasksController, 'destroy'])


// //Son versiyon
// router.get('/get-tasks', [TasksControllerV2, 'getTasks'])
// router.post('/create-tasks', [TasksControllerV2, 'createTasks'])
// router.post('/update-tasks', [TasksControllerV2, 'updateTasks'])
// router.delete('/delate-tasks/:id', [TasksControllerV2, 'deleteTasks'])

//AUTH CONTROLLER İÇİN E TİCARET SİTESİ İÇİN YAZILDI
router.post('/e-register', [AuthController, 'eRegister'])
router.post('/e-login', [AuthController, 'eLogin'])
router.get('/me', [AuthController, 'me']) // Kullanıcı bilgisi

/*//login olan kullanıcının bilgilerini döner 
Route.get('/me', async ({ auth }) => {
  return auth.user
}).middleware('auth')*/

/* =======================
   CATEGORIES (ADMIN)
======================= */

// // Listele //version 1 örneği
// router
//   .get('/admin/categories', [ECategoriesController, 'E_index'])
//   .use(['admin'])

// Listele
router
  .get('/admin/categories', [ECategoriesController, 'E_index'])
  .use(middleware.adminOrSeller())

// Oluştur
router
  .post('/admin/categories', [ECategoriesController, 'E_store'])
  .use(middleware.adminOrSeller())

// Güncelle (POST)
router
  .post('/admin/categories/:id', [ECategoriesController, 'E_update'])
  .use(middleware.adminOrSeller())

// Sil (DELETE)
router
  .delete('/admin/categories/:id', [ECategoriesController, 'E_destroy'])
  .use(middleware.adminOrSeller())

/* =======================
   PRODUCTS (ADMIN)
======================= */

// Listele
router
  .get('/admin/products', [EProductsController, 'E_index'])
  .use(middleware.adminOrSeller())

// Oluştur
router
  .post('/admin/products', [EProductsController, 'E_store'])
  .use(middleware.adminOrSeller())

// Güncelle (POST)
router
  .post('/admin/products/:id', [EProductsController, 'E_update'])
  .use(middleware.adminOrSeller())

// Sil (DELETE)
router
  .delete('/admin/products/:id', [EProductsController, 'E_destroy'])
  .use(middleware.adminOrSeller())

// Ürüne kategori ekle
router
  .post('/admin/products/:id/add-categories', [EProductsController, 'addCategories'])
  .use(middleware.adminOrSeller())

// Üründen kategori çıkar
router
  .post('/admin/products/:id/remove-categories', [EProductsController, 'removeCategories'])
  .use(middleware.adminOrSeller())
/* =======================
   ORDERS (ADMIN)
======================= */

// Tüm siparişler
router
  .get('/admin/orders', [EOrdersController, 'E_index'])
  .use(middleware.admin())

// Sipariş detayı (admin)
router
  .get('/admin/orders/:id', [EOrdersController, 'show'])
  .use(middleware.admin())

// Durum güncelle 
router
  .post('/admin/orders/:id/update-status', [EOrdersController, 'updateStatus']) //pending', 'paid', 'canceled', 'shipped
  .use(middleware.admin())

/* =======================
   ORDERS (SELLER)
======================= */

// Seller kendi mağazasının siparişlerini listeleyebilir
router
  .get('/seller/orders', [EOrdersController, 'sellerOrders'])
  .use(middleware.seller())

// Seller sipariş detayını görebilir (sadece kendi mağazasının ürünlerini)
router
  .get('/seller/orders/:id', [EOrdersController, 'show'])
  .use(middleware.seller())

// Seller sadece 'shipped' durumuna geçirebilir
router
  .post('/seller/orders/:id/update-status', [EOrdersController, 'updateStatus'])
  .use(middleware.seller())

/* =======================
   ORDERS (CUSTOMER) 
======================= */

// Müşteri kendi siparişlerini görebilir -sepet hariç-
router.get('/customer/orders', [EOrdersController, 'myOrders'])


// Müşteri sipariş detayını görebilir
router.get('/customer/orders/:id', [EOrdersController, 'show'])

// // Müşteri yeni sipariş oluşturabilir //bunu arık cart ile yapıyoruz
// router.post('/customer/orders', [EOrdersController, 'store'])

/* =======================
   CART (CUSTOMER) - Sepet Sistemi
======================= */

// Sepeti görüntüle
router.get('/customer/cart', [ECartsController, 'show'])

// Sepete ürün ekle
router.post('/customer/cart/add', [ECartsController, 'addItem'])

// Sepet ürün miktarını güncelle
router.post('/customer/cart/update', [ECartsController, 'updateItem'])

// Sepetten ürün sil
router.delete('/customer/cart/remove/:itemId', [ECartsController, 'removeItem'])

// Sepeti temizle
router.delete('/customer/cart/clear', [ECartsController, 'clear'])

// Sepeti siparişe dönüştür (checkout)
router.post('/customer/cart/checkout', [ECartsController, 'checkout'])

/* =======================
   ADDRESSES (CUSTOMER )
======================= */

// Adresleri listele
router.get('/customer/addresses', [EAddressesController, 'index'])

// Tek bir adresi görüntüle
router.get('/customer/addresses/:id', [EAddressesController, 'show'])

// Yeni adres oluştur
router.post('/customer/addresses', [EAddressesController, 'store'])

// Adresi güncelle
router.post('/customer/addresses/:id', [EAddressesController, 'update'])

// Adresi varsayılan yap
router.post('/customer/addresses/:id/set-default', [EAddressesController, 'setDefault'])

// Adresi sil
router.delete('/customer/addresses/:id', [EAddressesController, 'destroy'])

/* =======================
   MARKETS (CUSTOMER / SELLER)
======================= */

// Mağaza oluştur (customer → seller)
router.post('/customer/create-market', [EMarketsController, 'createMarket'])

/* =======================
   MARKETS (SELLER)
======================= */

// Kendi mağazamı getir
router.get('/seller/my-market', [EMarketsController, 'myMarket'])

// Kendi mağazamı güncelle
router.post('/seller/my-market/update', [EMarketsController, 'updateMyMarket'])

/* =======================
   MARKETS (ADMIN)
======================= */

// Tüm mağazaları listele
router
  .get('/admin/markets', [EMarketsController, 'adminIndex'])
  .use(middleware.admin())

// Mağaza onayla / reddet
router
  .post('/admin/markets/:id/verify', [EMarketsController, 'verifyMarket'])
  .use(middleware.admin())

// Mağaza aktif / pasif
router
  .post('/admin/markets/:id/toggle-active', [EMarketsController, 'toggleActive'])
  .use(middleware.admin())

  /* =======================
   MARKETS (PUBLIC)
======================= */

// Tüm aktif mağazalar
router.get('/markets', [EMarketsController, 'publicIndex'])

// Slug ile mağaza detayı
router.get('/markets/:slug', [EMarketsController, 'showBySlug'])