export type UserRole = 'patient' | 'doctor' | 'nurse' | 'admin' | 'public_health';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaToken?: string;
}

export interface LoginResponse {
  requiresMFA: boolean;
  user?: User;
  tokens?: AuthTokens;
  userId?: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
