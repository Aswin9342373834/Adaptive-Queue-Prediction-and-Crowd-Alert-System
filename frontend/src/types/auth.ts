export type UserRole = 'manager' | 'staff' | 'receptionist' | null;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'staff' | 'receptionist';
  counterNumber?: string;
  branchName: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (role: 'manager' | 'staff' | 'receptionist', email: string, counter?: string) => void;
  logout: () => void;
}

