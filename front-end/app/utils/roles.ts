export const Roles = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
} as const

export function hasRole(userRole: string, requiredRole: string): boolean {
  const hierarchy = ['user', 'moderator', 'admin']
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(requiredRole)
}
