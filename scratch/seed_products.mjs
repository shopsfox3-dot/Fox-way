import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://buldwdvngkglkwvwttzk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bGR3ZHZuZ2tnbGt3dnd0dHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY1Njc2NiwiZXhwIjoyMTAyMjMyNzY2fQ.JmffGu7hTEOQ2Oxsl9DkzR2yxMIGeDaF0GMCHFdV23s';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const sampleCategories = [
  { name: 'مواد غذائية', icon: 'ShoppingBasket', sort_order: 1 },
  { name: 'مشروبات', icon: 'Coffee', sort_order: 2 },
  { name: 'منتجات الأطفال', icon: 'Baby', sort_order: 3 },
  { name: 'منظفات', icon: 'Sparkles', sort_order: 4 },
  { name: 'عناية شخصية', icon: 'HeartHandshake', sort_order: 5 },
  { name: 'متجر متعدد', icon: 'Package', sort_order: 6 },
];

const sampleProducts = [
  { cat: 'مواد غذائية', name: 'زيت المائدة 5 لتر (إيليو)', description: 'زيت نباتي صافي مكرر للطهي والقلي', price: 650.00, unit: 'قارورة', stock: 250, sort_order: 1 },
  { cat: 'مواد غذائية', name: 'سميد ممتاز 25 كغ (سيم)', description: 'سميد قمح صلب ممتاز للعجين والكسكسي', price: 1850.00, unit: 'كيس', stock: 120, sort_order: 2 },
  { cat: 'مواد غذائية', name: 'فرينة فاخرة 10 كغ (ماما)', description: 'طحين أبيض فاخر للمخبوزات والحلويات', price: 420.00, unit: 'كيس', stock: 300, sort_order: 3 },
  { cat: 'مواد غذائية', name: 'سكر أبيض 5 كغ (سيفيتال)', description: 'سكر مكرر عالي الجودة', price: 390.00, unit: 'كيس', stock: 400, sort_order: 4 },
  { cat: 'مواد غذائية', name: 'معكرونة 500غ كرتونة (20 علبة)', description: 'عجائن قمح صلب فاخرة متنوعة', price: 1700.00, unit: 'كرتونة', stock: 180, sort_order: 5 },
  { cat: 'مواد غذائية', name: 'طماطم مصبرة 800غ (12 علبة)', description: 'معجون طماطم مركز مضاعف 28%', price: 2100.00, unit: 'كرتونة', stock: 150, sort_order: 6 },

  { cat: 'مشروبات', name: 'ماء معدني 1.5 لتر (حزمة 6 قارورات)', description: 'مياه معدنية طبيعية نقية', price: 180.00, unit: 'حزمة', stock: 500, sort_order: 1 },
  { cat: 'مشروبات', name: 'مشروب غازي كوكاكولا 1 لتر (12 قارورة)', description: 'مشروب غازي منعش أصلي', price: 1100.00, unit: 'صندوق', stock: 200, sort_order: 2 },
  { cat: 'مشروبات', name: 'عصير فواكه رامي 1 لتر (12 علبة)', description: 'عصير برتقال ومشمش طبيعي', price: 1250.00, unit: 'كرتونة', stock: 160, sort_order: 3 },
  { cat: 'مشروبات', name: 'قهوة مطحونة فاميكو 250غ (20 علبة)', description: 'بن محمص ومطحون ذو نكهة قوية', price: 4800.00, unit: 'كرتونة', stock: 90, sort_order: 4 },

  { cat: 'منتجات الأطفال', name: 'حفاضات كانبيبي حجم 4 (64 حبة)', description: 'حفاضات أطفال فائقة الامتصاص والنعومة', price: 1450.00, unit: 'حزمة', stock: 140, sort_order: 1 },
  { cat: 'منتجات الأطفال', name: 'حليب أطفال بريما 400غ (12 علبة)', description: 'حليب بودرة مدعم بالفيتامينات والمعادن', price: 5400.00, unit: 'كرتونة', stock: 80, sort_order: 2 },
  { cat: 'منتجات الأطفال', name: 'مناديل مبللة للأطفال (حزمة 72 منديل)', description: 'مناديل ناعمة خالية من الكحول والبارابين', price: 180.00, unit: 'علبة', stock: 350, sort_order: 3 },

  { cat: 'منظفات', name: 'سائل غسيل الأواني إيزيس 3 لتر', description: 'منظف أواني مركز برائحة الليمون', price: 420.00, unit: 'قارورة', stock: 220, sort_order: 1 },
  { cat: 'منظفات', name: 'مسحوق غسيل أومو 5 كغ أوتوماتيك', description: 'مسحوق إزالة أصعب البقع برائحة الانتعاش', price: 1350.00, unit: 'كيس', stock: 110, sort_order: 2 },
  { cat: 'منظفات', name: 'ماء جافيل براف 5 لتر', description: 'معقم ومبيض قوي متعدد الاستعمالات', price: 230.00, unit: 'بيدون', stock: 260, sort_order: 3 },
  { cat: 'منظفات', name: 'منظف ومعطر أرضيات ساف 3 لتر', description: 'معطر مركز يدوم طويلاً برائحة اللافندر', price: 340.00, unit: 'قارورة', stock: 190, sort_order: 4 },

  { cat: 'عناية شخصية', name: 'شامبو ألترا دو 400 مل (6 علب)', description: 'شامبو مغذي للشعر بخلاصة الأفوكادو', price: 1980.00, unit: 'علبة', stock: 130, sort_order: 1 },
  { cat: 'عناية شخصية', name: 'صابون بالدوليف 125غ (حزمة 12 صابونة)', description: 'صابون مرطب ومغذي للبشرة', price: 890.00, unit: 'حزمة', stock: 240, sort_order: 2 },
  { cat: 'عناية شخصية', name: 'معجون أسنان سيجنال 75 مل (12 علبة)', description: 'معجون حماية متكاملة ضد التسوس', price: 1560.00, unit: 'كرتونة', stock: 170, sort_order: 3 },

  { cat: 'متجر متعدد', name: 'أكياس بلاستيك بيضاء 500 حبة', description: 'أكياس تسوق متينة ومقاومة للتمزق', price: 450.00, unit: 'حزمة', stock: 300, sort_order: 1 },
  { cat: 'متجر متعدد', name: 'ورق ألمنيوم للطهي 50 متر', description: 'لفافة قصدير حراري عالي الجودة', price: 380.00, unit: 'لفة', stock: 150, sort_order: 2 },
];

async function seedData() {
  console.log('Inserting categories...');
  // Check if categories already exist
  const { data: existingCats } = await supabase.from('categories').select('*');
  let cats = existingCats || [];

  if (cats.length === 0) {
    const { data: inserted, error } = await supabase.from('categories').insert(sampleCategories).select();
    if (error) {
      console.error('Error categories:', error);
      return;
    }
    cats = inserted;
    console.log('Inserted categories:', cats.length);
  }

  const catMap = {};
  cats.forEach(c => { catMap[c.name] = c.id; });

  const { data: existingProds } = await supabase.from('products').select('*');
  if (!existingProds || existingProds.length === 0) {
    const productsToInsert = sampleProducts.map(p => ({
      category_id: catMap[p.cat],
      name: p.name,
      description: p.description,
      price: p.price,
      unit: p.unit,
      stock: p.stock,
      sort_order: p.sort_order,
      market_unavailable: false,
    }));

    const { data: insertedProds, error: prodErr } = await supabase.from('products').insert(productsToInsert).select();
    if (prodErr) {
      console.error('Error products:', prodErr);
      return;
    }
    console.log(`Inserted ${insertedProds.length} products successfully!`);
  } else {
    console.log(`Already have ${existingProds.length} products in database.`);
  }
}

seedData();
