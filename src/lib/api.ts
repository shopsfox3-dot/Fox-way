import { supabase } from '@/lib/supabase';
import type { Wilaya, Commune, Category, Product, ShopType } from '@/types';

const MOCK_WILAYAS: Wilaya[] = [
  { id: 1, code: '16', name: 'الجزائر', sort_order: 1 },
  { id: 2, code: '31', name: 'وهران', sort_order: 2 },
  { id: 3, code: '25', name: 'قسنطينة', sort_order: 3 },
  { id: 4, code: '06', name: 'بجاية', sort_order: 4 },
  { id: 5, code: '13', name: 'تلمسان', sort_order: 5 },
  { id: 6, code: '19', name: 'سطيف', sort_order: 6 },
];

const MOCK_COMMUNES: Commune[] = [
  { id: 1, wilaya_code: '16', name: 'الجزائر الوسطى' },
  { id: 2, wilaya_code: '16', name: 'باب الوادي' },
  { id: 3, wilaya_code: '16', name: 'حسين داي' },
  { id: 4, wilaya_code: '31', name: 'وهران' },
  { id: 5, wilaya_code: '31', name: 'السانية' },
  { id: 6, wilaya_code: '25', name: 'قسنطينة' },
];

const MOCK_SHOP_TYPES: ShopType[] = [
  { id: 1, name: 'صيدلية', icon: 'Pill', sort_order: 1 },
  { id: 2, name: 'كيوسك', icon: 'Newspaper', sort_order: 2 },
  { id: 3, name: 'سوبر ماركت', icon: 'ShoppingCart', sort_order: 3 },
  { id: 4, name: 'مستحضرات تجميل', icon: 'Sparkles', sort_order: 4 },
  { id: 5, name: 'كانكاري', icon: 'Store', sort_order: 5 },
];

const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'مواد غذائية', icon: 'ShoppingBasket', sort_order: 1 },
  { id: 'cat-2', name: 'مشروبات', icon: 'Coffee', sort_order: 2 },
  { id: 'cat-3', name: 'منتجات الأطفال', icon: 'Baby', sort_order: 3 },
  { id: 'cat-4', name: 'منظفات', icon: 'Sparkles', sort_order: 4 },
  { id: 'cat-5', name: 'عناية شخصية', icon: 'HeartHandshake', sort_order: 5 },
  { id: 'cat-6', name: 'متجر متعدد', icon: 'Package', sort_order: 6 },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'p-1', category_id: 'cat-1', name: 'زيت المائدة 5 لتر', description: 'زيت نباتي مكرر للتعبئة', price: 850, unit: 'علبة', stock: 200, image_url: null, sort_order: 1, market_unavailable: false },
  { id: 'p-2', category_id: 'cat-1', name: 'سميد متوسط 5 كغ', description: 'سميد من القمح الصلب', price: 450, unit: 'كيس', stock: 150, image_url: null, sort_order: 2, market_unavailable: false },
  { id: 'p-3', category_id: 'cat-1', name: 'طحين فاخر 25 كغ', description: 'طحين أبيض فاخر للخبز', price: 1200, unit: 'كيس', stock: 100, image_url: null, sort_order: 3, market_unavailable: false },
  { id: 'p-4', category_id: 'cat-1', name: 'سكر أبيض 5 كغ', description: 'سكر مكرر حبيبات', price: 375, unit: 'كيس', stock: 300, image_url: null, sort_order: 4, market_unavailable: false },
  { id: 'p-5', category_id: 'cat-2', name: 'ماء معدني 1.5 لتر (12 حبة)', description: 'علبة ماء معدني طبيعي', price: 180, unit: 'علبة', stock: 400, image_url: null, sort_order: 1, market_unavailable: false },
  { id: 'p-6', category_id: 'cat-2', name: 'عصير مشكل 1 لتر', description: 'عصير فواكه مشكل طبيعي', price: 120, unit: 'علبة', stock: 250, image_url: null, sort_order: 2, market_unavailable: false },
  { id: 'p-7', category_id: 'cat-3', name: 'حفاضات حجم 4 (60 قطعة)', description: 'حفاضات أطفال قطن ناعم', price: 750, unit: 'علبة', stock: 100, image_url: null, sort_order: 1, market_unavailable: false },
  { id: 'p-8', category_id: 'cat-4', name: 'سائل جلي 1 لتر', description: 'سائل غسيل الصحون المركز', price: 180, unit: 'علبة', stock: 300, image_url: null, sort_order: 1, market_unavailable: false },
  { id: 'p-9', category_id: 'cat-5', name: 'شامبو 400 مل', description: 'شامبو لجميع أنواع الشعر', price: 250, unit: 'علبة', stock: 150, image_url: null, sort_order: 1, market_unavailable: false },
  { id: 'p-10', category_id: 'cat-6', name: 'أكياس بلاستيكية (500 قطعة)', description: 'أكياس متعددة الأحجام', price: 200, unit: 'علبة', stock: 300, image_url: null, sort_order: 1, market_unavailable: false },
  { id: 'p-11', category_id: 'cat-5', name: 'فرشاة أسنان', description: 'فرشاة أسنان ناعمة للعناية اليومية', price: 150, unit: 'قطعة', stock: 120, image_url: null, sort_order: 5, market_unavailable: false },
];

const MOCK_PRODUCT_SHOP_TYPE_PRICES = [
  { product_id: 'p-11', shop_type_id: 1, price: 175 }, // Pharmacy / صيدلية -> 175 DA
  { product_id: 'p-11', shop_type_id: 3, price: 130 }, // Superette / سوبر ماركت -> 130 DA
];

export async function fetchWilayas(): Promise<Wilaya[]> {
  try {
    const { data, error } = await supabase
      .from('wilayas')
      .select('*')
      .order('sort_order');
    if (error || !data || data.length === 0) return MOCK_WILAYAS;
    return data as Wilaya[];
  } catch {
    return MOCK_WILAYAS;
  }
}

export async function fetchCommunes(wilayaCode: string): Promise<Commune[]> {
  try {
    const { data, error } = await supabase
      .from('communes')
      .select('*')
      .eq('wilaya_code', wilayaCode)
      .order('name');
    if (error || !data || data.length === 0) {
      return MOCK_COMMUNES.filter(c => c.wilaya_code === wilayaCode);
    }
    return data as Commune[];
  } catch {
    return MOCK_COMMUNES.filter(c => c.wilaya_code === wilayaCode);
  }
}

export async function fetchShopTypes(): Promise<ShopType[]> {
  try {
    const { data, error } = await supabase
      .from('shop_types')
      .select('*')
      .order('sort_order');
    if (error || !data || data.length === 0) return MOCK_SHOP_TYPES;
    return data as ShopType[];
  } catch {
    return MOCK_SHOP_TYPES;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    if (error || !data || data.length === 0) return MOCK_CATEGORIES;
    return data as Category[];
  } catch {
    return MOCK_CATEGORIES;
  }
}

export async function fetchProductsByCategory(categoryId: string, shopTypeId?: number | null): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_shop_type_prices (
          price,
          shop_type_id
        )
      `)
      .eq('category_id', categoryId)
      .order('sort_order');

    if (error || !data || data.length === 0) {
      return MOCK_PRODUCTS.filter(p => p.category_id === categoryId).map((p) => {
        const customPriceObj = MOCK_PRODUCT_SHOP_TYPE_PRICES.find(
          (cp) => cp.product_id === p.id && cp.shop_type_id === shopTypeId
        );
        return {
          ...p,
          price: customPriceObj ? customPriceObj.price : p.price,
        };
      });
    }

    return data.map((p: any) => {
      const customPriceObj = p.product_shop_type_prices?.find(
        (pt: any) => pt.shop_type_id === shopTypeId
      );
      const resolvedPrice = customPriceObj ? Number(customPriceObj.price) : p.price;
      
      const { product_shop_type_prices, ...rest } = p;
      return {
        ...rest,
        price: resolvedPrice,
      } as Product;
    });
  } catch {
    return MOCK_PRODUCTS.filter(p => p.category_id === categoryId).map((p) => {
      const customPriceObj = MOCK_PRODUCT_SHOP_TYPE_PRICES.find(
        (cp) => cp.product_id === p.id && cp.shop_type_id === shopTypeId
      );
      return {
        ...p,
        price: customPriceObj ? customPriceObj.price : p.price,
      };
    });
  }
}

export async function fetchProductCountByCategory(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category_id');
    if (error || !data || data.length === 0) {
      const counts: Record<string, number> = {};
      MOCK_PRODUCTS.forEach((row) => {
        counts[row.category_id] = (counts[row.category_id] || 0) + 1;
      });
      return counts;
    }
    const counts: Record<string, number> = {};
    (data as { category_id: string }[]).forEach((row) => {
      counts[row.category_id] = (counts[row.category_id] || 0) + 1;
    });
    return counts;
  } catch {
    const counts: Record<string, number> = {};
    MOCK_PRODUCTS.forEach((row) => {
      counts[row.category_id] = (counts[row.category_id] || 0) + 1;
    });
    return counts;
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
  } catch {
    // Ignore error in preview mode
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
  } catch {
    // Ignore error in preview mode
  }
}
