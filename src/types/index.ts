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
  name_fr?: string | null;
  icon: string | null;
  sort_order: number;
  brand_images?: string[];
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;           // سعر الحبة المفردة
  cost_price?: number | null; // سعر التكلفة التقديري (خاص بالأدمن)
  unit: string;
  stock: number;
  image_url: string | null;
  sort_order: number;
  market_unavailable: boolean;
  // ميزة البيع بالحبة والكرتونة
  units_per_pack: number | null;  // عدد الحبات في الكرتونة
  pack_label: string | null;      // اسم الوحدة الكبيرة
  pack_price: number | null;      // سعر الحبة عند الشراء بالكرتونة (null = نفس سعر الحبة)
  barcode?: string | null;        // باركود المنتج
}

export interface ShopType {
  id: number;
  name: string;
  icon: string | null;
  sort_order: number;
}

export interface Profile {
  id: string;
  email?: string;
  phone: string;
  wilaya_code: string;
  commune_id: number;
  shop_type_id: number | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  status: 'pending' | 'active' | 'rejected' | 'approved';
  role: 'client' | 'admin' | 'merchant';
  is_activated?: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  purchase_mode: 'unit' | 'pack'; // حبة بحبة أو بالكرتونة
}

export interface AbandonedCart {
  id: string;
  user_id: string;
  items: CartItem[];
  updated_at: string;
  profile?: Profile;
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

