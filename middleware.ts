export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/', '/log/:path*', '/settings'],
}
