// /*
// |--------------------------------------------------------------------------
// | HTTP kernel file
// |--------------------------------------------------------------------------
// |
// | The HTTP kernel file is used to register the middleware with the server
// | or the router.
// |
// */

// import router from '@adonisjs/core/services/router'
// import server from '@adonisjs/core/services/server'


// /**
//  * The error handler is used to convert an exception
//  * to an HTTP response.
//  */
// server.errorHandler(() => import('#exceptions/handler'))

// /**
//  * The server middleware stack runs middleware on all the HTTP
//  * requests, even if there is no route registered for
//  * the request URL.
//  */
// server.use([
//   () => import('#middleware/container_bindings_middleware'),
//   () => import('#middleware/force_json_response_middleware'),
//   () => import('@adonisjs/cors/cors_middleware'),
//   () => import('#middleware/bearer_auth_middleware')
// ])

// /**
//  * The router middleware stack runs middleware on all the HTTP
//  * requests with a registered route.
//  */
// router.use([() => import('@adonisjs/core/bodyparser_middleware')])

// /**
//  * Named middleware collection must be explicitly assigned to
//  * the routes or the routes group.
//  */
// /*
// //export const middleware = router.named({}) //benim yaptığım değişiklik jira task assign projesi için bu blok eklendi
// const __adonis_middleware = (globalThis as any).__adonis_middleware__ || router.named({});
// (globalThis as any).__adonis_middleware__ = __adonis_middleware
// export { __adonis_middleware as middleware }*/

// //E TİCARET İÇİN OLUŞTURULDU e ticaret projesinde bu blok aktif olacak jirada üstteki
// const __adonis_middleware =
//   (globalThis as any).__adonis_middleware__ ||
//   router.named({
//     admin: () => import('#middleware/admin_middleware'),
//     auth: () => import('#middleware/bearer_auth_middleware'),
//   })

// ;(globalThis as any).__adonis_middleware__ = __adonis_middleware
// export { __adonis_middleware as middleware }

/*
|--------------------------------------------------------------------------
| HTTP kernel file
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

server.errorHandler(() => import('#exceptions/handler'))

server.use([
  () => import('#middleware/container_bindings_middleware'),
  () => import('#middleware/force_json_response_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
  () => import('#middleware/bearer_auth_middleware'),
])

router.use([() => import('@adonisjs/core/bodyparser_middleware')])

// Named middleware
const __adonis_middleware =
  (globalThis as any).__adonis_middleware__ ||
  router.named({
    admin: () => import('#middleware/admin_middleware'),
    seller: () => import('#middleware/seller_middleware'),
    adminOrSeller: () => import('#middleware/admin_or_seller_middleware'),
  })

  ; (globalThis as any).__adonis_middleware__ = __adonis_middleware
export { __adonis_middleware as middleware }
