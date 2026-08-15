export interface Wilaya {
  id: number;
  code: string;
  name: string;
  sort_order: number;
}

export interface Commune {
  id: number;
  wilaya_code: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  stock: number;
  image_url: string | null;
  sort_order: number;
  market_unavailable: boolean;
}

export interface ShopType {
  id: number;
  name: string;
  icon: string | null;
  sort_order: number;
}

export interface Profile {
  id: string;
  phone: string;
  wilaya_code: string;
  commune_id: number;
  shop_type_id: number | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  status: 'pending' | 'active' | 'rejected' | 'approved';
  role: 'client' | 'admin' | 'merchant';
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  client_id: string;
  status: string;
  total: number;
  created_at: string;
}

export interface LoginAttempt {
  id: string;
  email: string;
  attempted_at: string;
  attempted_password?: string;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
  status: string;
}

