export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role: number;
  tailleCm?: number;
  organisationId: number;
}

export interface AuthResponse {
  id: string;
  userName: string;
  email: string;
  token: string;
}
