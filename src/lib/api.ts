import { supabase } from '@/lib/supabase';
import type { Wilaya, Commune, Category, Product, ShopType } from '@/types';
import { ALL_WILAYAS, ALL_COMMUNES } from './algeria_data';

export async function fetchWilayas(): Promise<Wilaya[]> {
  try {
    const { data, error } = await supabase
      .from('wilayas')
      .select('*')
      .order('sort_order');
    if (error || !data || data.length < 69) return ALL_WILAYAS;
    return data as Wilaya[];
  } catch {
    return ALL_WILAYAS;
  }
}

export async function fetchCommunes(wilayaCode: string): Promise<Commune[]> {
  try {
    const { data, error } = await supabase
      .from('communes')
      .select('*')
      .eq('wilaya_code', wilayaCode)
      .order('name');
    if (!error && data && data.length > 0) {
      return data as Commune[];
    }
    const codePadded = wilayaCode.padStart(2, '0');
    return ALL_COMMUNES.filter(c => c.wilaya_code === wilayaCode || c.wilaya_code === codePadded);
  } catch {
    const codePadded = wilayaCode.padStart(2, '0');
    return ALL_COMMUNES.filter(c => c.wilaya_code === wilayaCode || c.wilaya_code === codePadded);
  }
}

export async function fetchShopTypes(): Promise<ShopType[]> {
  try {
    const { data, error } = await supabase
      .from('shop_types')
      .select('*')
      .order('sort_order');
    if (error || !data) return [];
    return data as ShopType[];
  } catch {
    return [];
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

export async function fetchProductsByCategory(categoryId: string): Promise<Product[]> {
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
