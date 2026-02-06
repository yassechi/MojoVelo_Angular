export interface User {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  role: number;
  tailleCm?: number;
  isActif: boolean;
  organisationId: number;
}

export enum UserRole {
  Admin = 1,
  Manager = 2,
  User = 3
}
