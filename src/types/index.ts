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

export interface AddressData {
  street: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
}

export interface DocumentData {
  type: 'AADHAR' | 'PAN' | 'PASSPORT' | 'LICENCE';
  cardNumber: string;
  file?: Express.Multer.File;
}

export interface CustomerData {
  name: string;
  email: string;
  number: string;
  address: AddressData;
  document: DocumentData;
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
  number?: string;
  address?: Partial<AddressData>;
}

export interface UpdateDocumentData {
  type?: 'AADHAR' | 'PAN' | 'PASSPORT' | 'LICENCE';
  cardNumber?: string;
  file?: Express.Multer.File;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}