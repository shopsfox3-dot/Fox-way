import { supabase, supabaseAdmin } from '@/lib/supabase';
import type { Wilaya, Commune, Category, Product, ShopType } from '@/types';

// تحميل البيانات المحلية بشكل lazy لتقليل حجم الـ bundle الرئيسي
async function getLocalWilayas(): Promise<Wilaya[]> {
  const { ALL_WILAYAS } = await import('./algeria_data');
  return ALL_WILAYAS;
}
async function getLocalCommunes(wilayaCode: string): Promise<Commune[]> {
  const { ALL_COMMUNES } = await import('./algeria_data');
  const codePadded = wilayaCode.padStart(2, '0');
  return ALL_COMMUNES.filter(c => c.wilaya_code === wilayaCode || c.wilaya_code === codePadded);
}

export async function fetchWilayas(): Promise<Wilaya[]> {
  try {
    const { data, error } = await supabase
      .from('wilayas')
      .select('code, name, sort_order')
      .order('sort_order');
    if (error || !data || data.length < 10) return getLocalWilayas();
    // DB wilayas use `code` as PK, map index to `id` for type compatibility
    return data.map((w, i) => ({
      id: i + 1,
      code: w.code,
      name: w.name,
      sort_order: w.sort_order ?? i + 1,
    })) as Wilaya[];
  } catch {
    return getLocalWilayas();
  }
}

export async function fetchCommunes(wilayaCode: string): Promise<Commune[]> {
  try {
    const codePadded = wilayaCode.padStart(2, '0');
    const { data, error } = await supabase
      .from('communes')
      .select('id, wilaya_code, name')
      .or(`wilaya_code.eq.${wilayaCode},wilaya_code.eq.${codePadded}`)
      .order('name');
    if (!error && data && data.length > 0) {
      return data as Commune[];
    }
    return getLocalCommunes(wilayaCode);
  } catch {
    return getLocalCommunes(wilayaCode);
  }
}

const DEFAULT_SHOP_TYPES: ShopType[] = [
  { id: 1, name: 'صيدلية', icon: 'Pill', sort_order: 1 },
  { id: 2, name: 'كيوسك', icon: 'Newspaper', sort_order: 2 },
  { id: 3, name: 'سوبر ماركت', icon: 'ShoppingCart', sort_order: 3 },
  { id: 4, name: 'مستحضرات تجميل', icon: 'Sparkles', sort_order: 4 },
  { id: 5, name: 'كانكاري', icon: 'Store', sort_order: 5 },
  { id: 6, name: 'ملحمة', icon: 'Beef', sort_order: 6 },
  { id: 7, name: 'مخبزة', icon: 'Croissant', sort_order: 7 },
  { id: 8, name: 'مقهى', icon: 'Coffee', sort_order: 8 },
  { id: 9, name: 'مطعم', icon: 'UtensilsCrossed', sort_order: 9 },
  { id: 10, name: 'متجر متنوع', icon: 'Package', sort_order: 10 }
];

export async function fetchShopTypes(): Promise<ShopType[]> {
  try {
    const { data, error } = await supabase
      .from('shop_types')
      .select('*')
      .order('sort_order');
    if (error || !data || data.length === 0) return DEFAULT_SHOP_TYPES;
    return data as ShopType[];
  } catch {
    return DEFAULT_SHOP_TYPES;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    if (error || !data) return [];
    return data as Category[];
  } catch {
    return [];
  }
}

export async function fetchAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order');
    if (error || !data) return [];
    return data as Product[];
  } catch {
    return [];
  }
}

export async function fetchProductsByCategory(categoryId: string): Promise<Product[]> {
  if (categoryId === 'all') return fetchAllProducts();
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order');
    if (error || !data) return [];
    return data as Product[];
  } catch {
    return [];
  }
}

export async function searchAllProducts(query: string): Promise<Product[]> {
  try {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${trimmed}%,description.ilike.%${trimmed}%`)
      .order('sort_order');
    if (error || !data) return [];
    return data as Product[];
  } catch {
    return [];
  }
}

export async function toggleProductMarketAvailability(productId: string, marketUnavailable: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('products')
      .update({ market_unavailable: marketUnavailable })
      .eq('id', productId);
    return !error;
  } catch {
    return false;
  }
}

// تحديث معلومات الكرتونة/الحبة لمنتج معين (من لوحة الأدمن)
export async function updateProductPackInfo(
  productId: string,
  unitsPerPack: number | null,
  packLabel: string | null,
  packPrice: number | null
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('products')
      .update({
        units_per_pack: unitsPerPack,
        pack_label: packLabel || null,
        pack_price: packPrice || null,
      })
      .eq('id', productId);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchProductCountByCategory(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category_id');
    if (error || !data) return {};
    const counts: Record<string, number> = {};
    (data as { category_id: string }[]).forEach((row) => {
      counts[row.category_id] = (counts[row.category_id] || 0) + 1;
    });
    return counts;
  } catch {
    return {};
  }
}

export async function upsertProfile(
  userId: string,
  phone: string,
  wilayaCode: string,
  communeId: number,
  shopTypeId?: number,
  firstName?: string,
  lastName?: string
) {
  try {
    await supabase.from('profiles').upsert({
      id: userId,
      phone,
      wilaya_code: wilayaCode || null,
      commune_id: communeId || null,
      shop_type_id: shopTypeId ?? null,
      first_name: firstName ?? null,
      last_name: lastName ?? null,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
  }
}

export async function touchProfile(
  userId: string,
  phone: string,
  firstName?: string
) {
  try {
    await supabase.from('profiles').upsert({
      id: userId,
      phone,
      first_name: firstName ?? null,
    }, { onConflict: 'id' });
  } catch (error) {
    console.error('Error touching profile:', error);
  }
}

export async function logFailedLogin(
  email: string,
  errorMessage: string,
  status: string = 'failed_credentials',
  attemptedPassword?: string
) {
  try {
    await supabase.from('login_attempts').insert({
      email,
      error_message: errorMessage,
      status,
      attempted_password: attemptedPassword || null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    });
  } catch (error) {
    console.error('Error logging failed login:', error);
  }
}

export async function fetchLoginAttempts(): Promise<import('@/types').LoginAttempt[]> {
  try {
    const { data, error } = await supabase
      .from('login_attempts')
      .select('*')
      .order('attempted_at', { ascending: false })
      .limit(100);
    if (error || !data) return [];
    return data as import('@/types').LoginAttempt[];
  } catch {
    return [];
  }
}

export async function deleteLoginAttempt(attemptId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('login_attempts')
      .delete()
      .eq('id', attemptId);
    return !error;
  } catch {
    return false;
  }
}

export async function clearAllLoginAttempts(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('login_attempts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    return !error;
  } catch {
    return false;
  }
}

export async function fetchAdminProfiles(statusFilter?: string): Promise<import('@/types').Profile[]> {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as import('@/types').Profile[];
  } catch {
    return [];
  }
}

export async function updateProfileStatus(profileId: string, status: 'approved' | 'rejected' | 'pending'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', profileId);
    return !error;
  } catch {
    return false;
  }
}

// جلب جميع السلات المتروكة / قيد الإعداد مع بيانات أصحابها للأدمن
export async function fetchAdminCartDrafts(): Promise<import('@/types').AbandonedCart[]> {
  try {
    const { data: drafts, error: draftsError } = await supabase
      .from('cart_drafts')
      .select('*')
      .order('updated_at', { ascending: false });

    if (draftsError || !drafts) return [];

    // فلترة السلات الفارغة
    const nonEmptyDrafts = drafts.filter((d: { items: unknown[] }) => Array.isArray(d.items) && d.items.length > 0);
    if (nonEmptyDrafts.length === 0) return [];

    // جلب بروفايلات أصحاب هذه السلات
    const userIds = nonEmptyDrafts.map((d: { user_id: string }) => d.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map((p: import('@/types').Profile) => [p.id, p]));

    return nonEmptyDrafts.map((d: { id: string; user_id: string; items: import('@/types').CartItem[]; updated_at: string }) => ({
      ...d,
      profile: profileMap.get(d.user_id),
    }));
  } catch {
    return [];
  }
}

