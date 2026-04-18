export interface UserProfile {
  id: string;
  displayName?: string;
  defaultCurrency: string;
  theme: 'dark' | 'light' | 'system';
  fmpApiKey?: string;
  createdAt: string;
}
