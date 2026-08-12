import { supabase } from '@/lib/supabase';
import type { Wilaya, Commune, Category, Product, ShopType } from '@/types';

export async function fetchWilayas(): Promise<Wilaya[]> {
  const { data, error } = await supabase
    .from('wilayas')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data as Wilaya[];
}

export async function fetchCommunes(wilayaCode: string): Promise<Commune[]> {
  const { data, error } = await supabase
    .from('communes')
    .select('*')
    .eq('wilaya_code', wilayaCode)
    .order('name');
  if (error) throw error;
  return data as Commune[];
}

export async function fetchShopTypes(): Promise<ShopType[]> {
  const { data, error } = await supabase
    .from('shop_types')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data as ShopType[];
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data as Category[];
}

export async function fetchProductsByCategory(categoryId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .order('sort_order');
  if (error) throw error;
  return data as Product[];
}

export async function fetchProductCountByCategory(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('products')
    .select('category_id');
  if (error) throw error;
  const counts: Record<string, number> = {};
  (data as { category_id: string }[]).forEach((row) => {
    counts[row.category_id] = (counts[row.category_id] || 0) + 1;
  });
  return counts;
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
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    phone,
    wilaya_code: wilayaCode,
    commune_id: communeId,
    shop_type_id: shopTypeId ?? null,
    first_name: firstName ?? null,
    last_name: lastName ?? null,
  });
  if (error) throw error;
}
