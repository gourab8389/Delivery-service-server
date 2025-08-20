export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  resetCode: string;
  newPassword: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
}

export interface CustomerData {
  name: string;
  email: string;
  number: string;
  address: Address;
  bankDetails: string;
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
  number?: string;
  address?: string;
  bankDetails?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
