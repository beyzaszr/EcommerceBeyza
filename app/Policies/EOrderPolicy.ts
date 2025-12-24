export default class EOrderPolicy {
  // Allow viewing an order if the user owns it or is an admin
  public async view(user: any, order: any) {
    if (!user) return false
    return user.role === 'admin' || user.id === order.user_id
  }

  // Allow creating an order for authenticated users
  public async create(user: any) {
    return !!user
  }

  // Allow updating only by owner or admin
  public async update(user: any, order: any) {
    if (!user) return false
    return user.role === 'admin' || user.id === order.user_id
  }

  // Allow deleting by owner or admin
  public async delete(user: any, order: any) {
    if (!user) return false
    return user.role === 'admin' || user.id === order.user_id
  }
}
