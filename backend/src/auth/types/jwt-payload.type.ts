export interface JwtPayload {
  sub: string;
  email: string;
  role: 'painter' | 'customer';
}
