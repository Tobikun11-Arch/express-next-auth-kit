export type UserType = 'user' | 'admin';

export function getDashboardPath(userType: UserType) {
  if (userType === 'admin') return '/admin/dashboard';
  if (userType === 'user') return '/dashboard';
  return '/customer/dashboard';
}