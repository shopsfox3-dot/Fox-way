import type { Wilaya, Commune } from '@/types';

export const WILAYA_LATIN_NAMES: Record<string, string> = {
  '01': 'Adrar',
  '02': 'Chlef',
  '03': 'Laghouat',
  '04': 'Oum El Bouaghi',
  '05': 'Batna',
  '06': 'Béjaïa',
  '07': 'Biskra',
  '08': 'Béchar',
  '09': 'Blida',
  '10': 'Bouira',
  '11': 'Tamanrasset',
  '12': 'Tébessa',
  '13': 'Tlemcen',
  '14': 'Tiaret',
  '15': 'Tizi Ouzou',
  '16': 'Alger',
  '17': 'Djelfa',
  '18': 'Jijel',
  '19': 'Sétif',
  '20': 'Saïda',
  '21': 'Skikda',
  '22': 'Sidi Bel Abbès',
  '23': 'Annaba',
  '24': 'Guelma',
  '25': 'Constantine',
  '26': 'Médéa',
  '27': 'Mostaganem',
  '28': "M'Sila",
  '29': 'Mascara',
  '30': 'Ouargla',
  '31': 'Oran',
  '32': 'El Bayadh',
  '33': 'Illizi',
  '34': 'Bordj Bou Arréridj',
  '35': 'Boumerdès',
  '36': 'El Tarf',
  '37': 'Tindouf',
  '38': 'Tissemsilt',
  '39': 'El Oued',
  '40': 'Khenchela',
  '41': 'Souk Ahras',
  '42': 'Tipaza',
  '43': 'Mila',
  '44': 'Aïn Defla',
  '45': 'Naâma',
  '46': 'Aïn Témouchent',
  '47': 'Ghardaïa',
  '48': 'Relizane',
  '49': 'Timimoun',
  '50': 'Bordj Badji Mokhtar',
  '51': 'Ouled Djellal',
  '52': 'Béni Abbès',
  '53': 'In Salah',
  '54': 'In Guezzam',
  '55': 'Touggourt',
  '56': 'Djanet',
  '57': "El M'Ghair",
  '58': 'El Meniaa',
  '59': 'Aflou',
  '60': 'Barika',
  '61': 'El Kantara',
  '62': 'Bir El Ater',
  '63': 'El Aricha',
  '64': 'Ksar Chellala',
  '65': 'Aïn Oussera',
  '66': 'Messaad',
  '67': 'Ksar El Boukhari',
  '68': 'Bou Saâda',
  '69': 'El Abiodh Sidi Cheikh',
};

export const SHOP_TYPES_I18N: Record<number | string, { ar: string; fr: string; en: string }> = {
  1: { ar: 'صيدلية', fr: 'Pharmacie', en: 'Pharmacy' },
  2: { ar: 'كيوسك', fr: 'Kiosque & Tabac', en: 'Kiosk & Newsstand' },
  3: { ar: 'سوبر ماركت', fr: 'Supermarché / Supérette', en: 'Mini-Market / Supermarket' },
  4: { ar: 'مستحضرات تجميل', fr: 'Cosmétique & Beauté', en: 'Cosmetics & Beauty' },
  5: { ar: 'كانكاري', fr: 'Quincaillerie & Droguerie', en: 'Hardware & Tools' },
};

export function getShopTypeDisplayName(
  shopType: { id: number | string; name: string } | null | undefined,
  language: string
): string {
  if (!shopType) return '';
  const idKey = Number(shopType.id);
  if (SHOP_TYPES_I18N[idKey]) {
    return language === 'ar' ? SHOP_TYPES_I18N[idKey].ar : language === 'fr' ? SHOP_TYPES_I18N[idKey].fr : SHOP_TYPES_I18N[idKey].en;
  }
  const name = shopType.name || '';
  if (language === 'ar') return name;
  if (name.includes('صيدل')) return language === 'fr' ? 'Pharmacie' : 'Pharmacy';
  if (name.includes('كيوسك') || name.includes('كشك')) return language === 'fr' ? 'Kiosque & Tabac' : 'Kiosk & Newsstand';
  if (name.includes('سوبر') || name.includes('تغذية')) return language === 'fr' ? 'Supermarché / Supérette' : 'Mini-Market / Supermarket';
  if (name.includes('تجميل') || name.includes('كوسميتيك')) return language === 'fr' ? 'Cosmétique & Beauté' : 'Cosmetics & Beauty';
  if (name.includes('كانكاري') || name.includes('خردوات')) return language === 'fr' ? 'Quincaillerie' : 'Hardware & Tools';
  return name;
}

/**
 * محرك نقل الحروف الصوتية اللاتينية للبلديات الجزائرية
 * يحول أسماء البلديات إلى النطق الفرنسي/اللاتيني الرسمي المعتمد في الجزائر
 */
export function transliterateAlgerianName(arabicText: string): string {
  if (!arabicText) return '';
  let str = arabicText.trim();

  // 1. استبدال البادئات الجزائرية الشائعة
  const prefixes: [RegExp, string][] = [
    [/^(أولاد|اولاد)\s+/i, 'Ouled '],
    [/^(عين)\s+/i, 'Aïn '],
    [/^(سيدي)\s+/i, 'Sidi '],
    [/^(بني)\s+/i, 'Béni '],
    [/^(وادي)\s+/i, 'Oued '],
    [/^(بئر)\s+/i, 'Bir '],
    [/^(قصر)\s+/i, 'Ksar '],
    [/^(برج)\s+/i, 'Bordj '],
    [/^(أم|ام)\s+/i, 'Oum '],
    [/^(أبو|ابو)\s+/i, 'Abou '],
    [/^(بو)\s+/i, 'Bou '],
    [/^(حمام|حمّام)\s+/i, 'Hammam '],
    [/^(مرسى)\s+/i, 'Marsa '],
    [/^(رأس|راس)\s+/i, 'Ras '],
    [/^(حاسي)\s+/i, 'Hassi '],
    [/^(الحامة|الحامه)\s+/i, 'El Hamma '],
    [/^(شعبة|شعبه)\s+/i, 'Chaabet '],
    [/^(ضاية|ضایه)\s+/i, 'Dhaya '],
    [/^(تاوزيانت)\s*/i, 'Taouzient'],
    [/^(تاغيت)\s*/i, 'Taghit'],
  ];

  let prefixMatch = '';
  for (const [re, rep] of prefixes) {
    if (re.test(str)) {
      prefixMatch = rep;
      str = str.replace(re, '');
      break;
    }
  }

  // 2. معالجة "الـ" التعريف في الكلمات
  str = str.replace(/^ال([أإؤئءبتثجحخدذرزسشصضطظعغفقكلمنهوي])/g, 'El $1');
  str = str.replace(/\s+ال([أإؤئءبتثجحخدذرزسشصضطظعغفقكلمنهوي])/g, ' El $1');

  // 3. النقل الحرفي الصوتي الصامت والمتحرك
  const map: Record<string, string> = {
    'أ': 'A', 'إ': 'I', 'آ': 'A', 'ا': 'a', 'ء': '', 'ئ': 'i', 'ؤ': 'ou',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'dj', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'ch',
    'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
    'ف': 'f', 'ق': 'k', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'ou', 'ي': 'i', 'ى': 'a', 'ة': 'a',
    'َ': 'a', 'ُ': 'ou', 'ِ': 'i', 'ّ': '', 'ْ': '', 'ً': '', 'ٍ': '', 'ٌ': '',
  };

  const words = str.split(/\s+/).map((word) => {
    let latinWord = '';
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (map[char] !== undefined) {
        latinWord += map[char];
      } else {
        latinWord += char;
      }
    }
    // تنظيف الحروف المكررة والتنسيق
    latinWord = latinWord.replace(/ouou/g, 'ou').replace(/ii/g, 'i').replace(/aa/g, 'a');
    return latinWord.charAt(0).toUpperCase() + latinWord.slice(1).toLowerCase();
  });

  const result = (prefixMatch + words.join(' ')).trim();
  return result || arabicText;
}

export const ALL_WILAYAS: Wilaya[] = [
  {
    "id": 1,
    "code": "01",
    "name": "أدرار",
    "sort_order": 1
  },
  {
    "id": 2,
    "code": "02",
    "name": "الشلف",
    "sort_order": 2
  },
  {
    "id": 3,
    "code": "03",
    "name": "الأغواط",
    "sort_order": 3
  },
  {
    "id": 4,
    "code": "04",
    "name": "أم البواقي",
    "sort_order": 4
  },
  {
    "id": 5,
    "code": "05",
    "name": "باتنة",
    "sort_order": 5
  },
  {
    "id": 6,
    "code": "06",
    "name": "بجاية",
    "sort_order": 6
  },
  {
    "id": 7,
    "code": "07",
    "name": "بسكرة",
    "sort_order": 7
  },
  {
    "id": 8,
    "code": "08",
    "name": "بشار",
    "sort_order": 8
  },
  {
    "id": 9,
    "code": "09",
    "name": "البليدة",
    "sort_order": 9
  },
  {
    "id": 10,
    "code": "10",
    "name": "البويرة",
    "sort_order": 10
  },
  {
    "id": 11,
    "code": "11",
    "name": "تمنراست",
    "sort_order": 11
  },
  {
    "id": 12,
    "code": "12",
    "name": "تبسة",
    "sort_order": 12
  },
  {
    "id": 13,
    "code": "13",
    "name": "تلمسان",
    "sort_order": 13
  },
  {
    "id": 14,
    "code": "14",
    "name": "تيارت",
    "sort_order": 14
  },
  {
    "id": 15,
    "code": "15",
    "name": "تيزي وزو",
    "sort_order": 15
  },
  {
    "id": 16,
    "code": "16",
    "name": "الجزائر",
    "sort_order": 16
  },
  {
    "id": 17,
    "code": "17",
    "name": "الجلفة",
    "sort_order": 17
  },
  {
    "id": 18,
    "code": "18",
    "name": "جيجل",
    "sort_order": 18
  },
  {
    "id": 19,
    "code": "19",
    "name": "سطيف",
    "sort_order": 19
  },
  {
    "id": 20,
    "code": "20",
    "name": "سعيدة",
    "sort_order": 20
  },
  {
    "id": 21,
    "code": "21",
    "name": "سكيكدة",
    "sort_order": 21
  },
  {
    "id": 22,
    "code": "22",
    "name": "سيدي بلعباس",
    "sort_order": 22
  },
  {
    "id": 23,
    "code": "23",
    "name": "عنابة",
    "sort_order": 23
  },
  {
    "id": 24,
    "code": "24",
    "name": "قالمة",
    "sort_order": 24
  },
  {
    "id": 25,
    "code": "25",
    "name": "قسنطينة",
    "sort_order": 25
  },
  {
    "id": 26,
    "code": "26",
    "name": "المدية",
    "sort_order": 26
  },
  {
    "id": 27,
    "code": "27",
    "name": "مستغانم",
    "sort_order": 27
  },
  {
    "id": 28,
    "code": "28",
    "name": "المسيلة",
    "sort_order": 28
  },
  {
    "id": 29,
    "code": "29",
    "name": "معسكر",
    "sort_order": 29
  },
  {
    "id": 30,
    "code": "30",
    "name": "ورقلة",
    "sort_order": 30
  },
  {
    "id": 31,
    "code": "31",
    "name": "وهران",
    "sort_order": 31
  },
  {
    "id": 32,
    "code": "32",
    "name": "البيض",
    "sort_order": 32
  },
  {
    "id": 33,
    "code": "33",
    "name": "إليزي",
    "sort_order": 33
  },
  {
    "id": 34,
    "code": "34",
    "name": "برج بوعريريج",
    "sort_order": 34
  },
  {
    "id": 35,
    "code": "35",
    "name": "بومرداس",
    "sort_order": 35
  },
  {
    "id": 36,
    "code": "36",
    "name": "الطارف",
    "sort_order": 36
  },
  {
    "id": 37,
    "code": "37",
    "name": "تندوف",
    "sort_order": 37
  },
  {
    "id": 38,
    "code": "38",
    "name": "تيسمسيلت",
    "sort_order": 38
  },
  {
    "id": 39,
    "code": "39",
    "name": "الوادي",
    "sort_order": 39
  },
  {
    "id": 40,
    "code": "40",
    "name": "خنشلة",
    "sort_order": 40
  },
  {
    "id": 41,
    "code": "41",
    "name": "سوق أهراس",
    "sort_order": 41
  },
  {
    "id": 42,
    "code": "42",
    "name": "تيبازة",
    "sort_order": 42
  },
  {
    "id": 43,
    "code": "43",
    "name": "ميلة",
    "sort_order": 43
  },
  {
    "id": 44,
    "code": "44",
    "name": "عين الدفلى",
    "sort_order": 44
  },
  {
    "id": 45,
    "code": "45",
    "name": "النعامة",
    "sort_order": 45
  },
  {
    "id": 46,
    "code": "46",
    "name": "عين تموشنت",
    "sort_order": 46
  },
  {
    "id": 47,
    "code": "47",
    "name": "غرداية",
    "sort_order": 47
  },
  {
    "id": 48,
    "code": "48",
    "name": "غليزان",
    "sort_order": 48
  },
  {
    "id": 49,
    "code": "49",
    "name": "تيميمون",
    "sort_order": 49
  },
  {
    "id": 50,
    "code": "50",
    "name": "برج باجي مختار",
    "sort_order": 50
  },
  {
    "id": 51,
    "code": "51",
    "name": "أولاد جلال",
    "sort_order": 51
  },
  {
    "id": 52,
    "code": "52",
    "name": "بني عباس",
    "sort_order": 52
  },
  {
    "id": 53,
    "code": "53",
    "name": "عين صالح",
    "sort_order": 53
  },
  {
    "id": 54,
    "code": "54",
    "name": "عين قزام",
    "sort_order": 54
  },
  {
    "id": 55,
    "code": "55",
    "name": "توقرت",
    "sort_order": 55
  },
  {
    "id": 56,
    "code": "56",
    "name": "جانت",
    "sort_order": 56
  },
  {
    "id": 57,
    "code": "57",
    "name": "المغير",
    "sort_order": 57
  },
  {
    "id": 58,
    "code": "58",
    "name": "المنيعة",
    "sort_order": 58
  },
  {
    "id": 59,
    "code": "59",
    "name": "آفلو",
    "sort_order": 59
  },
  {
    "id": 60,
    "code": "60",
    "name": "بريكة",
    "sort_order": 60
  },
  {
    "id": 61,
    "code": "61",
    "name": "القنطرة",
    "sort_order": 61
  },
  {
    "id": 62,
    "code": "62",
    "name": "بئر العاتر",
    "sort_order": 62
  },
  {
    "id": 63,
    "code": "63",
    "name": "العريشة",
    "sort_order": 63
  },
  {
    "id": 64,
    "code": "64",
    "name": "قصر الشلالة",
    "sort_order": 64
  },
  {
    "id": 65,
    "code": "65",
    "name": "عين وسارة",
    "sort_order": 65
  },
  {
    "id": 66,
    "code": "66",
    "name": "مسعد",
    "sort_order": 66
  },
  {
    "id": 67,
    "code": "67",
    "name": "قصر البخاري",
    "sort_order": 67
  },
  {
    "id": 68,
    "code": "68",
    "name": "بوسعادة",
    "sort_order": 68
  },
  {
    "id": 69,
    "code": "69",
    "name": "الأبيض سيدي الشيخ",
    "sort_order": 69
  }
];

export const ALL_COMMUNES: Commune[] = [
  {
    "id": 1,
    "wilaya_code": "01",
    "name": "أدرار"
  },
  {
    "id": 2,
    "wilaya_code": "01",
    "name": "اقبلي"
  },
  {
    "id": 3,
    "wilaya_code": "01",
    "name": "أولف"
  },
  {
    "id": 4,
    "wilaya_code": "01",
    "name": "بودة"
  },
  {
    "id": 5,
    "wilaya_code": "01",
    "name": "فنوغيل"
  },
  {
    "id": 6,
    "wilaya_code": "01",
    "name": "إن زغمير"
  },
  {
    "id": 7,
    "wilaya_code": "01",
    "name": "أولاد أحمد تيمي"
  },
  {
    "id": 8,
    "wilaya_code": "01",
    "name": "رقان"
  },
  {
    "id": 9,
    "wilaya_code": "01",
    "name": "سالي"
  },
  {
    "id": 10,
    "wilaya_code": "01",
    "name": "السبع"
  },
  {
    "id": 11,
    "wilaya_code": "01",
    "name": "تامنطيط"
  },
  {
    "id": 12,
    "wilaya_code": "01",
    "name": "تامست"
  },
  {
    "id": 13,
    "wilaya_code": "01",
    "name": "تيمقتن"
  },
  {
    "id": 14,
    "wilaya_code": "01",
    "name": "تيت"
  },
  {
    "id": 15,
    "wilaya_code": "01",
    "name": "تسابيت"
  },
  {
    "id": 16,
    "wilaya_code": "01",
    "name": "زاوية كنتة"
  },
  {
    "id": 17,
    "wilaya_code": "02",
    "name": "أبو الحسن"
  },
  {
    "id": 18,
    "wilaya_code": "02",
    "name": "عين مران"
  },
  {
    "id": 19,
    "wilaya_code": "02",
    "name": "بنايرية"
  },
  {
    "id": 20,
    "wilaya_code": "02",
    "name": "بني بوعتاب"
  },
  {
    "id": 21,
    "wilaya_code": "02",
    "name": "بني حواء"
  },
  {
    "id": 22,
    "wilaya_code": "02",
    "name": "بني راشد"
  },
  {
    "id": 23,
    "wilaya_code": "02",
    "name": "بوقادير"
  },
  {
    "id": 24,
    "wilaya_code": "02",
    "name": "بوزغاية"
  },
  {
    "id": 25,
    "wilaya_code": "02",
    "name": "بريرة"
  },
  {
    "id": 26,
    "wilaya_code": "02",
    "name": "الشطية"
  },
  {
    "id": 27,
    "wilaya_code": "02",
    "name": "الشلف"
  },
  {
    "id": 28,
    "wilaya_code": "02",
    "name": "الظهرة"
  },
  {
    "id": 29,
    "wilaya_code": "02",
    "name": "الحجاج"
  },
  {
    "id": 30,
    "wilaya_code": "02",
    "name": "الكريمية"
  },
  {
    "id": 31,
    "wilaya_code": "02",
    "name": "المرسى"
  },
  {
    "id": 32,
    "wilaya_code": "02",
    "name": "حرشون"
  },
  {
    "id": 33,
    "wilaya_code": "02",
    "name": "الهرانفة"
  },
  {
    "id": 34,
    "wilaya_code": "02",
    "name": "الأبيض مجاجة"
  },
  {
    "id": 35,
    "wilaya_code": "02",
    "name": "مصدق"
  },
  {
    "id": 36,
    "wilaya_code": "02",
    "name": "وادي الفضة"
  },
  {
    "id": 37,
    "wilaya_code": "02",
    "name": "وادي قوسين"
  },
  {
    "id": 38,
    "wilaya_code": "02",
    "name": "وادي سلي"
  },
  {
    "id": 39,
    "wilaya_code": "02",
    "name": "أولاد عباس"
  },
  {
    "id": 40,
    "wilaya_code": "02",
    "name": "أولاد بن عبد القادر"
  },
  {
    "id": 41,
    "wilaya_code": "02",
    "name": "أولاد فارس"
  },
  {
    "id": 42,
    "wilaya_code": "02",
    "name": "أم الدروع"
  },
  {
    "id": 43,
    "wilaya_code": "02",
    "name": "سنجاس"
  },
  {
    "id": 44,
    "wilaya_code": "02",
    "name": "سيدي عبد الرحمن"
  },
  {
    "id": 45,
    "wilaya_code": "02",
    "name": "سيدي عكاشة"
  },
  {
    "id": 46,
    "wilaya_code": "02",
    "name": "الصبحة"
  },
  {
    "id": 47,
    "wilaya_code": "02",
    "name": "تاجنة"
  },
  {
    "id": 48,
    "wilaya_code": "02",
    "name": "تلعصة"
  },
  {
    "id": 49,
    "wilaya_code": "02",
    "name": "تاوقريت"
  },
  {
    "id": 50,
    "wilaya_code": "02",
    "name": "تنس"
  },
  {
    "id": 51,
    "wilaya_code": "02",
    "name": "الزبوجة"
  },
  {
    "id": 52,
    "wilaya_code": "03",
    "name": "عين ماضي"
  },
  {
    "id": 53,
    "wilaya_code": "03",
    "name": "بن ناصر بن شهرة"
  },
  {
    "id": 54,
    "wilaya_code": "03",
    "name": "العسافية"
  },
  {
    "id": 55,
    "wilaya_code": "03",
    "name": "الحويطة"
  },
  {
    "id": 56,
    "wilaya_code": "03",
    "name": "حاسي الدلاعة"
  },
  {
    "id": 57,
    "wilaya_code": "03",
    "name": "حاسي الرمل"
  },
  {
    "id": 58,
    "wilaya_code": "03",
    "name": "الخنق"
  },
  {
    "id": 59,
    "wilaya_code": "03",
    "name": "قصر الحيران"
  },
  {
    "id": 60,
    "wilaya_code": "03",
    "name": "الأغواط"
  },
  {
    "id": 61,
    "wilaya_code": "03",
    "name": "سيدي مخلوف"
  },
  {
    "id": 62,
    "wilaya_code": "03",
    "name": "تاجموت"
  },
  {
    "id": 63,
    "wilaya_code": "03",
    "name": "تاجرونة"
  },
  {
    "id": 64,
    "wilaya_code": "04",
    "name": "عين ببوش"
  },
  {
    "id": 65,
    "wilaya_code": "04",
    "name": "عين البيضاء"
  },
  {
    "id": 66,
    "wilaya_code": "04",
    "name": "عين الديس"
  },
  {
    "id": 67,
    "wilaya_code": "04",
    "name": "عين فكرون"
  },
  {
    "id": 68,
    "wilaya_code": "04",
    "name": "عين كرشة"
  },
  {
    "id": 69,
    "wilaya_code": "04",
    "name": "عين مليلة"
  },
  {
    "id": 70,
    "wilaya_code": "04",
    "name": "عين الزيتون"
  },
  {
    "id": 71,
    "wilaya_code": "04",
    "name": "بحير الشرقي"
  },
  {
    "id": 72,
    "wilaya_code": "04",
    "name": "بريش"
  },
  {
    "id": 73,
    "wilaya_code": "04",
    "name": "بئر الشهداء"
  },
  {
    "id": 74,
    "wilaya_code": "04",
    "name": "الضلعة"
  },
  {
    "id": 75,
    "wilaya_code": "04",
    "name": "العامرية"
  },
  {
    "id": 76,
    "wilaya_code": "04",
    "name": "البلالة"
  },
  {
    "id": 77,
    "wilaya_code": "04",
    "name": "الجازية"
  },
  {
    "id": 78,
    "wilaya_code": "04",
    "name": "الفجوج بوغرارة سعودي"
  },
  {
    "id": 79,
    "wilaya_code": "04",
    "name": "الحرملية"
  },
  {
    "id": 80,
    "wilaya_code": "04",
    "name": "فكيرينة"
  },
  {
    "id": 81,
    "wilaya_code": "04",
    "name": "هنشير تومغني"
  },
  {
    "id": 82,
    "wilaya_code": "04",
    "name": "قصر الصباحي"
  },
  {
    "id": 83,
    "wilaya_code": "04",
    "name": "مسكيانة"
  },
  {
    "id": 84,
    "wilaya_code": "04",
    "name": "وادي نيني"
  },
  {
    "id": 85,
    "wilaya_code": "04",
    "name": "أولاد قاسم"
  },
  {
    "id": 86,
    "wilaya_code": "04",
    "name": "أولاد حملة"
  },
  {
    "id": 87,
    "wilaya_code": "04",
    "name": "أولاد زواي"
  },
  {
    "id": 88,
    "wilaya_code": "04",
    "name": "أم البواقي"
  },
  {
    "id": 89,
    "wilaya_code": "04",
    "name": "الرحية"
  },
  {
    "id": 90,
    "wilaya_code": "04",
    "name": "سيقوس"
  },
  {
    "id": 91,
    "wilaya_code": "04",
    "name": "سوق نعمان"
  },
  {
    "id": 92,
    "wilaya_code": "04",
    "name": "الزرق"
  },
  {
    "id": 93,
    "wilaya_code": "05",
    "name": "عين جاسر"
  },
  {
    "id": 94,
    "wilaya_code": "05",
    "name": "عين التوتة"
  },
  {
    "id": 95,
    "wilaya_code": "05",
    "name": "عين ياقوت"
  },
  {
    "id": 96,
    "wilaya_code": "05",
    "name": "أريس"
  },
  {
    "id": 97,
    "wilaya_code": "05",
    "name": "باتنة"
  },
  {
    "id": 98,
    "wilaya_code": "05",
    "name": "بني فضالة الحقانية"
  },
  {
    "id": 99,
    "wilaya_code": "05",
    "name": "بولهيلات"
  },
  {
    "id": 100,
    "wilaya_code": "05",
    "name": "بومقر"
  },
  {
    "id": 101,
    "wilaya_code": "05",
    "name": "بومية"
  },
  {
    "id": 102,
    "wilaya_code": "05",
    "name": "بوزينة"
  },
  {
    "id": 103,
    "wilaya_code": "05",
    "name": "الشمرة"
  },
  {
    "id": 104,
    "wilaya_code": "05",
    "name": "شير"
  },
  {
    "id": 105,
    "wilaya_code": "05",
    "name": "جرمة"
  },
  {
    "id": 106,
    "wilaya_code": "05",
    "name": "الحاسي"
  },
  {
    "id": 107,
    "wilaya_code": "05",
    "name": "المعذر"
  },
  {
    "id": 108,
    "wilaya_code": "05",
    "name": "فسديس"
  },
  {
    "id": 109,
    "wilaya_code": "05",
    "name": "فم الطوب"
  },
  {
    "id": 110,
    "wilaya_code": "05",
    "name": "غسيرة"
  },
  {
    "id": 111,
    "wilaya_code": "05",
    "name": "القصبات"
  },
  {
    "id": 112,
    "wilaya_code": "05",
    "name": "القيقبة"
  },
  {
    "id": 113,
    "wilaya_code": "05",
    "name": "حيدوسة"
  },
  {
    "id": 114,
    "wilaya_code": "05",
    "name": "إشمول"
  },
  {
    "id": 115,
    "wilaya_code": "05",
    "name": "إينوغيسن"
  },
  {
    "id": 116,
    "wilaya_code": "05",
    "name": "كيمل"
  },
  {
    "id": 117,
    "wilaya_code": "05",
    "name": "قصر بلزمة"
  },
  {
    "id": 118,
    "wilaya_code": "05",
    "name": "لارباع"
  },
  {
    "id": 119,
    "wilaya_code": "05",
    "name": "لازرو"
  },
  {
    "id": 120,
    "wilaya_code": "05",
    "name": "لمسان"
  },
  {
    "id": 121,
    "wilaya_code": "05",
    "name": "معافة"
  },
  {
    "id": 122,
    "wilaya_code": "05",
    "name": "منعة"
  },
  {
    "id": 123,
    "wilaya_code": "05",
    "name": "مروانة"
  },
  {
    "id": 124,
    "wilaya_code": "05",
    "name": "نقاوس"
  },
  {
    "id": 125,
    "wilaya_code": "05",
    "name": "وادي الشعبة"
  },
  {
    "id": 126,
    "wilaya_code": "05",
    "name": "وادي الماء"
  },
  {
    "id": 127,
    "wilaya_code": "05",
    "name": "وادي الطاقة"
  },
  {
    "id": 128,
    "wilaya_code": "05",
    "name": "أولاد عوف"
  },
  {
    "id": 129,
    "wilaya_code": "05",
    "name": "أولاد فاضل"
  },
  {
    "id": 130,
    "wilaya_code": "05",
    "name": "أولاد سلام"
  },
  {
    "id": 131,
    "wilaya_code": "05",
    "name": "أولاد سي سليمان"
  },
  {
    "id": 132,
    "wilaya_code": "05",
    "name": "عيون العصافير"
  },
  {
    "id": 133,
    "wilaya_code": "05",
    "name": "الرحبات"
  },
  {
    "id": 134,
    "wilaya_code": "05",
    "name": "رأس العيون"
  },
  {
    "id": 135,
    "wilaya_code": "05",
    "name": "سفيان"
  },
  {
    "id": 136,
    "wilaya_code": "05",
    "name": "سريانة"
  },
  {
    "id": 137,
    "wilaya_code": "05",
    "name": "تكوت"
  },
  {
    "id": 138,
    "wilaya_code": "05",
    "name": "تالخمت"
  },
  {
    "id": 139,
    "wilaya_code": "05",
    "name": "تاكسلانت"
  },
  {
    "id": 140,
    "wilaya_code": "05",
    "name": "تازولت"
  },
  {
    "id": 141,
    "wilaya_code": "05",
    "name": "ثنية العابد"
  },
  {
    "id": 142,
    "wilaya_code": "05",
    "name": "تيغانمين"
  },
  {
    "id": 143,
    "wilaya_code": "05",
    "name": "تغرغار"
  },
  {
    "id": 144,
    "wilaya_code": "05",
    "name": "تيمقاد"
  },
  {
    "id": 145,
    "wilaya_code": "05",
    "name": "زانة البيضاء"
  },
  {
    "id": 146,
    "wilaya_code": "06",
    "name": "أدكار"
  },
  {
    "id": 147,
    "wilaya_code": "06",
    "name": "أيت رزين"
  },
  {
    "id": 148,
    "wilaya_code": "06",
    "name": "أيت إسماعيل"
  },
  {
    "id": 149,
    "wilaya_code": "06",
    "name": "أقبو"
  },
  {
    "id": 150,
    "wilaya_code": "06",
    "name": "أكفادو"
  },
  {
    "id": 151,
    "wilaya_code": "06",
    "name": "أمالو"
  },
  {
    "id": 152,
    "wilaya_code": "06",
    "name": "أميزور"
  },
  {
    "id": 153,
    "wilaya_code": "06",
    "name": "أوقاس"
  },
  {
    "id": 154,
    "wilaya_code": "06",
    "name": "برباشة"
  },
  {
    "id": 155,
    "wilaya_code": "06",
    "name": "بجاية"
  },
  {
    "id": 156,
    "wilaya_code": "06",
    "name": "بني جليل"
  },
  {
    "id": 157,
    "wilaya_code": "06",
    "name": "بني كسيلة"
  },
  {
    "id": 158,
    "wilaya_code": "06",
    "name": "بني مليكش"
  },
  {
    "id": 159,
    "wilaya_code": "06",
    "name": "بني معوش"
  },
  {
    "id": 160,
    "wilaya_code": "06",
    "name": "بو جليل"
  },
  {
    "id": 161,
    "wilaya_code": "06",
    "name": "بوحمزة"
  },
  {
    "id": 162,
    "wilaya_code": "06",
    "name": "بوخليفة"
  },
  {
    "id": 163,
    "wilaya_code": "06",
    "name": "شلاطة"
  },
  {
    "id": 164,
    "wilaya_code": "06",
    "name": "شميني"
  },
  {
    "id": 165,
    "wilaya_code": "06",
    "name": "درقينة"
  },
  {
    "id": 166,
    "wilaya_code": "06",
    "name": "ذراع القايد"
  },
  {
    "id": 167,
    "wilaya_code": "06",
    "name": "القصر"
  },
  {
    "id": 168,
    "wilaya_code": "06",
    "name": "فناية الماثن"
  },
  {
    "id": 169,
    "wilaya_code": "06",
    "name": "فرعون"
  },
  {
    "id": 170,
    "wilaya_code": "06",
    "name": "إغيل علي"
  },
  {
    "id": 171,
    "wilaya_code": "06",
    "name": "اغرم"
  },
  {
    "id": 172,
    "wilaya_code": "06",
    "name": "كنديرة"
  },
  {
    "id": 173,
    "wilaya_code": "06",
    "name": "خراطة"
  },
  {
    "id": 174,
    "wilaya_code": "06",
    "name": "الفلاي"
  },
  {
    "id": 175,
    "wilaya_code": "06",
    "name": "مسيسنة"
  },
  {
    "id": 176,
    "wilaya_code": "06",
    "name": "مالبو"
  },
  {
    "id": 177,
    "wilaya_code": "06",
    "name": "وادي غير"
  },
  {
    "id": 178,
    "wilaya_code": "06",
    "name": "أوزلاقن"
  },
  {
    "id": 179,
    "wilaya_code": "06",
    "name": "صدوق"
  },
  {
    "id": 180,
    "wilaya_code": "06",
    "name": "سيدي عياد"
  },
  {
    "id": 181,
    "wilaya_code": "06",
    "name": "سيدي عيش"
  },
  {
    "id": 182,
    "wilaya_code": "06",
    "name": "سمعون"
  },
  {
    "id": 183,
    "wilaya_code": "06",
    "name": "سوق لإثنين"
  },
  {
    "id": 184,
    "wilaya_code": "06",
    "name": "سوق اوفلا"
  },
  {
    "id": 185,
    "wilaya_code": "06",
    "name": "تالة حمزة"
  },
  {
    "id": 186,
    "wilaya_code": "06",
    "name": "تامقرة"
  },
  {
    "id": 187,
    "wilaya_code": "06",
    "name": "تامريجت"
  },
  {
    "id": 188,
    "wilaya_code": "06",
    "name": "تاوريرت إغيل"
  },
  {
    "id": 189,
    "wilaya_code": "06",
    "name": "تاسكريوت"
  },
  {
    "id": 190,
    "wilaya_code": "06",
    "name": "تازمالت"
  },
  {
    "id": 191,
    "wilaya_code": "06",
    "name": "طيبان"
  },
  {
    "id": 192,
    "wilaya_code": "06",
    "name": "تيشي"
  },
  {
    "id": 193,
    "wilaya_code": "06",
    "name": "تيفرة"
  },
  {
    "id": 194,
    "wilaya_code": "06",
    "name": "تيمزريت"
  },
  {
    "id": 195,
    "wilaya_code": "06",
    "name": "تينبدار"
  },
  {
    "id": 196,
    "wilaya_code": "06",
    "name": "تيزي نبربر"
  },
  {
    "id": 197,
    "wilaya_code": "06",
    "name": "توجة"
  },
  {
    "id": 198,
    "wilaya_code": "07",
    "name": "عين الناقة"
  },
  {
    "id": 199,
    "wilaya_code": "07",
    "name": "بسكرة"
  },
  {
    "id": 200,
    "wilaya_code": "07",
    "name": "برج بن عزوز"
  },
  {
    "id": 201,
    "wilaya_code": "07",
    "name": "بوشقرون"
  },
  {
    "id": 202,
    "wilaya_code": "07",
    "name": "شتمة"
  },
  {
    "id": 203,
    "wilaya_code": "07",
    "name": "الفيض"
  },
  {
    "id": 204,
    "wilaya_code": "07",
    "name": "الغروس"
  },
  {
    "id": 205,
    "wilaya_code": "07",
    "name": "الحاجب"
  },
  {
    "id": 206,
    "wilaya_code": "07",
    "name": "الحوش"
  },
  {
    "id": 207,
    "wilaya_code": "07",
    "name": "فوغالة"
  },
  {
    "id": 208,
    "wilaya_code": "07",
    "name": "خنقة سيدي ناجي"
  },
  {
    "id": 209,
    "wilaya_code": "07",
    "name": "ليشانة"
  },
  {
    "id": 210,
    "wilaya_code": "07",
    "name": "ليوة"
  },
  {
    "id": 211,
    "wilaya_code": "07",
    "name": "مشونش"
  },
  {
    "id": 212,
    "wilaya_code": "07",
    "name": "مليلي"
  },
  {
    "id": 213,
    "wilaya_code": "07",
    "name": "مخادمة"
  },
  {
    "id": 214,
    "wilaya_code": "07",
    "name": "المزيرعة"
  },
  {
    "id": 215,
    "wilaya_code": "07",
    "name": "أوماش"
  },
  {
    "id": 216,
    "wilaya_code": "07",
    "name": "أورلال"
  },
  {
    "id": 217,
    "wilaya_code": "07",
    "name": "سيدي عقبة"
  },
  {
    "id": 218,
    "wilaya_code": "07",
    "name": "طولقة"
  },
  {
    "id": 219,
    "wilaya_code": "07",
    "name": "زريبة الوادي"
  },
  {
    "id": 220,
    "wilaya_code": "08",
    "name": "العبادلة"
  },
  {
    "id": 221,
    "wilaya_code": "08",
    "name": "بشار"
  },
  {
    "id": 222,
    "wilaya_code": "08",
    "name": "بني ونيف"
  },
  {
    "id": 223,
    "wilaya_code": "08",
    "name": "بوكايس"
  },
  {
    "id": 224,
    "wilaya_code": "08",
    "name": "عرق فراج"
  },
  {
    "id": 225,
    "wilaya_code": "08",
    "name": "القنادسة"
  },
  {
    "id": 226,
    "wilaya_code": "08",
    "name": "لحمر"
  },
  {
    "id": 227,
    "wilaya_code": "08",
    "name": "مشرع هواري بومدين"
  },
  {
    "id": 228,
    "wilaya_code": "08",
    "name": "المريجة"
  },
  {
    "id": 229,
    "wilaya_code": "08",
    "name": "موغل"
  },
  {
    "id": 230,
    "wilaya_code": "08",
    "name": "تبلبالة"
  },
  {
    "id": 231,
    "wilaya_code": "08",
    "name": "تاغيت"
  },
  {
    "id": 232,
    "wilaya_code": "09",
    "name": "عين الرمانة"
  },
  {
    "id": 233,
    "wilaya_code": "09",
    "name": "بني مراد"
  },
  {
    "id": 234,
    "wilaya_code": "09",
    "name": "بني تامو"
  },
  {
    "id": 235,
    "wilaya_code": "09",
    "name": "بن خليل"
  },
  {
    "id": 236,
    "wilaya_code": "09",
    "name": "البليدة"
  },
  {
    "id": 237,
    "wilaya_code": "09",
    "name": "بوعرفة"
  },
  {
    "id": 238,
    "wilaya_code": "09",
    "name": "بوفاريك"
  },
  {
    "id": 239,
    "wilaya_code": "09",
    "name": "بوقرة"
  },
  {
    "id": 240,
    "wilaya_code": "09",
    "name": "بوعينان"
  },
  {
    "id": 241,
    "wilaya_code": "09",
    "name": "الشبلي"
  },
  {
    "id": 242,
    "wilaya_code": "09",
    "name": "الشفة"
  },
  {
    "id": 243,
    "wilaya_code": "09",
    "name": "الشريعة"
  },
  {
    "id": 244,
    "wilaya_code": "09",
    "name": "جبابرة"
  },
  {
    "id": 245,
    "wilaya_code": "09",
    "name": "العفرون"
  },
  {
    "id": 246,
    "wilaya_code": "09",
    "name": "قرواو"
  },
  {
    "id": 247,
    "wilaya_code": "09",
    "name": "حمام ملوان"
  },
  {
    "id": 248,
    "wilaya_code": "09",
    "name": "الأربعاء"
  },
  {
    "id": 249,
    "wilaya_code": "09",
    "name": "مفتاح"
  },
  {
    "id": 250,
    "wilaya_code": "09",
    "name": "موزاية"
  },
  {
    "id": 251,
    "wilaya_code": "09",
    "name": "وادي جر"
  },
  {
    "id": 252,
    "wilaya_code": "09",
    "name": "وادي العلايق"
  },
  {
    "id": 253,
    "wilaya_code": "09",
    "name": "اولاد سلامة"
  },
  {
    "id": 254,
    "wilaya_code": "09",
    "name": "أولاد يعيش"
  },
  {
    "id": 255,
    "wilaya_code": "09",
    "name": "صوحان"
  },
  {
    "id": 256,
    "wilaya_code": "09",
    "name": "الصومعة"
  },
  {
    "id": 257,
    "wilaya_code": "10",
    "name": "أغبالو"
  },
  {
    "id": 258,
    "wilaya_code": "10",
    "name": "أهل القصر"
  },
  {
    "id": 259,
    "wilaya_code": "10",
    "name": "عين الحجر"
  },
  {
    "id": 260,
    "wilaya_code": "10",
    "name": "عين العلوي"
  },
  {
    "id": 261,
    "wilaya_code": "10",
    "name": "عين الترك"
  },
  {
    "id": 262,
    "wilaya_code": "10",
    "name": "عين بسام"
  },
  {
    "id": 263,
    "wilaya_code": "10",
    "name": "أيت لعزيز"
  },
  {
    "id": 264,
    "wilaya_code": "10",
    "name": "أعمر"
  },
  {
    "id": 265,
    "wilaya_code": "10",
    "name": "آث منصور"
  },
  {
    "id": 266,
    "wilaya_code": "10",
    "name": "بشلول"
  },
  {
    "id": 267,
    "wilaya_code": "10",
    "name": "بئر غبالو"
  },
  {
    "id": 268,
    "wilaya_code": "10",
    "name": "برج أوخريص"
  },
  {
    "id": 269,
    "wilaya_code": "10",
    "name": "بودربالة"
  },
  {
    "id": 270,
    "wilaya_code": "10",
    "name": "البويرة"
  },
  {
    "id": 271,
    "wilaya_code": "10",
    "name": "بوكرم"
  },
  {
    "id": 272,
    "wilaya_code": "10",
    "name": "شرفة"
  },
  {
    "id": 273,
    "wilaya_code": "10",
    "name": "الدشمية"
  },
  {
    "id": 274,
    "wilaya_code": "10",
    "name": "ديرة"
  },
  {
    "id": 275,
    "wilaya_code": "10",
    "name": "جباحية"
  },
  {
    "id": 276,
    "wilaya_code": "10",
    "name": "العجيبة"
  },
  {
    "id": 277,
    "wilaya_code": "10",
    "name": "الأسنام"
  },
  {
    "id": 278,
    "wilaya_code": "10",
    "name": "الهاشمية"
  },
  {
    "id": 279,
    "wilaya_code": "10",
    "name": "الخبوزية"
  },
  {
    "id": 280,
    "wilaya_code": "10",
    "name": "الحاكمية"
  },
  {
    "id": 281,
    "wilaya_code": "10",
    "name": "المقراني"
  },
  {
    "id": 282,
    "wilaya_code": "10",
    "name": "قرومة"
  },
  {
    "id": 283,
    "wilaya_code": "10",
    "name": "الحجرة الزرقاء"
  },
  {
    "id": 284,
    "wilaya_code": "10",
    "name": "حيزر"
  },
  {
    "id": 285,
    "wilaya_code": "10",
    "name": "حنيف"
  },
  {
    "id": 286,
    "wilaya_code": "10",
    "name": "قادرية"
  },
  {
    "id": 287,
    "wilaya_code": "10",
    "name": "الأخضرية"
  },
  {
    "id": 288,
    "wilaya_code": "10",
    "name": "أمشدالة"
  },
  {
    "id": 289,
    "wilaya_code": "10",
    "name": "معلة"
  },
  {
    "id": 290,
    "wilaya_code": "10",
    "name": "المعمورة"
  },
  {
    "id": 291,
    "wilaya_code": "10",
    "name": "مزدور"
  },
  {
    "id": 292,
    "wilaya_code": "10",
    "name": "وادي البردي"
  },
  {
    "id": 293,
    "wilaya_code": "10",
    "name": "أولاد راشد"
  },
  {
    "id": 294,
    "wilaya_code": "10",
    "name": "روراوة"
  },
  {
    "id": 295,
    "wilaya_code": "10",
    "name": "ريدان"
  },
  {
    "id": 296,
    "wilaya_code": "10",
    "name": "سحاريج"
  },
  {
    "id": 297,
    "wilaya_code": "10",
    "name": "سوق الخميس"
  },
  {
    "id": 298,
    "wilaya_code": "10",
    "name": "سور الغزلان"
  },
  {
    "id": 299,
    "wilaya_code": "10",
    "name": "تاغزوت"
  },
  {
    "id": 300,
    "wilaya_code": "10",
    "name": "تاقديت"
  },
  {
    "id": 301,
    "wilaya_code": "10",
    "name": "زبربر"
  },
  {
    "id": 302,
    "wilaya_code": "11",
    "name": "ابلسة"
  },
  {
    "id": 303,
    "wilaya_code": "11",
    "name": "عين امقل"
  },
  {
    "id": 304,
    "wilaya_code": "11",
    "name": "أدلس"
  },
  {
    "id": 305,
    "wilaya_code": "11",
    "name": "تمنراست"
  },
  {
    "id": 306,
    "wilaya_code": "11",
    "name": "تاظروك"
  },
  {
    "id": 307,
    "wilaya_code": "12",
    "name": "عين الزرقاء"
  },
  {
    "id": 308,
    "wilaya_code": "12",
    "name": "بجن"
  },
  {
    "id": 309,
    "wilaya_code": "12",
    "name": "بكارية"
  },
  {
    "id": 310,
    "wilaya_code": "12",
    "name": "بئر الذهب"
  },
  {
    "id": 311,
    "wilaya_code": "12",
    "name": "بئر مقدم"
  },
  {
    "id": 312,
    "wilaya_code": "12",
    "name": "بوخضرة"
  },
  {
    "id": 313,
    "wilaya_code": "12",
    "name": "بولحاف الدير"
  },
  {
    "id": 314,
    "wilaya_code": "12",
    "name": "الشريعة"
  },
  {
    "id": 315,
    "wilaya_code": "12",
    "name": "الكويف"
  },
  {
    "id": 316,
    "wilaya_code": "12",
    "name": "الماء الابيض"
  },
  {
    "id": 317,
    "wilaya_code": "12",
    "name": "المريج"
  },
  {
    "id": 318,
    "wilaya_code": "12",
    "name": "المزرعة"
  },
  {
    "id": 319,
    "wilaya_code": "12",
    "name": "العقلة"
  },
  {
    "id": 320,
    "wilaya_code": "12",
    "name": "العوينات"
  },
  {
    "id": 321,
    "wilaya_code": "12",
    "name": "الحويجبات"
  },
  {
    "id": 322,
    "wilaya_code": "12",
    "name": "قريقر"
  },
  {
    "id": 323,
    "wilaya_code": "12",
    "name": "الحمامات"
  },
  {
    "id": 324,
    "wilaya_code": "12",
    "name": "مرسط"
  },
  {
    "id": 325,
    "wilaya_code": "12",
    "name": "الونزة"
  },
  {
    "id": 326,
    "wilaya_code": "12",
    "name": "أم علي"
  },
  {
    "id": 327,
    "wilaya_code": "12",
    "name": "صفصاف الوسرى"
  },
  {
    "id": 328,
    "wilaya_code": "12",
    "name": "سطح قنطيس"
  },
  {
    "id": 329,
    "wilaya_code": "12",
    "name": "تبسة"
  },
  {
    "id": 330,
    "wilaya_code": "12",
    "name": "ثليجان"
  },
  {
    "id": 331,
    "wilaya_code": "13",
    "name": "عين فتاح"
  },
  {
    "id": 332,
    "wilaya_code": "13",
    "name": "عين فزة"
  },
  {
    "id": 333,
    "wilaya_code": "13",
    "name": "عين غرابة"
  },
  {
    "id": 334,
    "wilaya_code": "13",
    "name": "عين الكبيرة"
  },
  {
    "id": 335,
    "wilaya_code": "13",
    "name": "عين النحالة"
  },
  {
    "id": 336,
    "wilaya_code": "13",
    "name": "عين تالوت"
  },
  {
    "id": 337,
    "wilaya_code": "13",
    "name": "عين يوسف"
  },
  {
    "id": 338,
    "wilaya_code": "13",
    "name": "عمير"
  },
  {
    "id": 339,
    "wilaya_code": "13",
    "name": "العزايل"
  },
  {
    "id": 340,
    "wilaya_code": "13",
    "name": "باب العسة"
  },
  {
    "id": 341,
    "wilaya_code": "13",
    "name": "بني بهدل"
  },
  {
    "id": 342,
    "wilaya_code": "13",
    "name": "بني بوسعيد"
  },
  {
    "id": 343,
    "wilaya_code": "13",
    "name": "بني خلاد"
  },
  {
    "id": 344,
    "wilaya_code": "13",
    "name": "بني مستر"
  },
  {
    "id": 345,
    "wilaya_code": "13",
    "name": "بني وارسوس"
  },
  {
    "id": 346,
    "wilaya_code": "13",
    "name": "بني صميل"
  },
  {
    "id": 347,
    "wilaya_code": "13",
    "name": "بني سنوس"
  },
  {
    "id": 348,
    "wilaya_code": "13",
    "name": "بن سكران"
  },
  {
    "id": 349,
    "wilaya_code": "13",
    "name": "بوحلو"
  },
  {
    "id": 350,
    "wilaya_code": "13",
    "name": "شتوان"
  },
  {
    "id": 351,
    "wilaya_code": "13",
    "name": "دار يغمراسن"
  },
  {
    "id": 352,
    "wilaya_code": "13",
    "name": "جبالة"
  },
  {
    "id": 353,
    "wilaya_code": "13",
    "name": "الفحول"
  },
  {
    "id": 354,
    "wilaya_code": "13",
    "name": "فلاوسن"
  },
  {
    "id": 355,
    "wilaya_code": "13",
    "name": "الغزوات"
  },
  {
    "id": 356,
    "wilaya_code": "13",
    "name": "حمام بوغرارة"
  },
  {
    "id": 357,
    "wilaya_code": "13",
    "name": "الحناية"
  },
  {
    "id": 358,
    "wilaya_code": "13",
    "name": "هنين"
  },
  {
    "id": 359,
    "wilaya_code": "13",
    "name": "مسيردة الفواقة"
  },
  {
    "id": 360,
    "wilaya_code": "13",
    "name": "مغنية"
  },
  {
    "id": 361,
    "wilaya_code": "13",
    "name": "منصورة"
  },
  {
    "id": 362,
    "wilaya_code": "13",
    "name": "مرسى بن مهيدي"
  },
  {
    "id": 363,
    "wilaya_code": "13",
    "name": "ندرومة"
  },
  {
    "id": 364,
    "wilaya_code": "13",
    "name": "وادي الخضر"
  },
  {
    "id": 365,
    "wilaya_code": "13",
    "name": "أولاد ميمون"
  },
  {
    "id": 366,
    "wilaya_code": "13",
    "name": "أولاد رياح"
  },
  {
    "id": 367,
    "wilaya_code": "13",
    "name": "الرمشي"
  },
  {
    "id": 368,
    "wilaya_code": "13",
    "name": "صبرة"
  },
  {
    "id": 369,
    "wilaya_code": "13",
    "name": "سبعة شيوخ"
  },
  {
    "id": 370,
    "wilaya_code": "13",
    "name": "سبدو"
  },
  {
    "id": 371,
    "wilaya_code": "13",
    "name": "سيدي العبدلي"
  },
  {
    "id": 372,
    "wilaya_code": "13",
    "name": "سيدي مجاهد"
  },
  {
    "id": 373,
    "wilaya_code": "13",
    "name": "السواحلية"
  },
  {
    "id": 374,
    "wilaya_code": "13",
    "name": "السواني"
  },
  {
    "id": 375,
    "wilaya_code": "13",
    "name": "سوق الثلاثاء"
  },
  {
    "id": 376,
    "wilaya_code": "13",
    "name": "تيرني بني هديل"
  },
  {
    "id": 377,
    "wilaya_code": "13",
    "name": "تيانت"
  },
  {
    "id": 378,
    "wilaya_code": "13",
    "name": "تلمسان"
  },
  {
    "id": 379,
    "wilaya_code": "13",
    "name": "زناتة"
  },
  {
    "id": 380,
    "wilaya_code": "14",
    "name": "عين بوشقيف"
  },
  {
    "id": 381,
    "wilaya_code": "14",
    "name": "عين الذهب"
  },
  {
    "id": 382,
    "wilaya_code": "14",
    "name": "عين دزاريت"
  },
  {
    "id": 383,
    "wilaya_code": "14",
    "name": "عين الحديد"
  },
  {
    "id": 384,
    "wilaya_code": "14",
    "name": "عين كرمس"
  },
  {
    "id": 385,
    "wilaya_code": "14",
    "name": "شحيمة"
  },
  {
    "id": 386,
    "wilaya_code": "14",
    "name": "دحموني"
  },
  {
    "id": 387,
    "wilaya_code": "14",
    "name": "جبيلات الرصفاء"
  },
  {
    "id": 388,
    "wilaya_code": "14",
    "name": "جيلالي بن عمار"
  },
  {
    "id": 389,
    "wilaya_code": "14",
    "name": "الفايجة"
  },
  {
    "id": 390,
    "wilaya_code": "14",
    "name": "فرندة"
  },
  {
    "id": 391,
    "wilaya_code": "14",
    "name": "قرطوفة"
  },
  {
    "id": 392,
    "wilaya_code": "14",
    "name": "مادنة"
  },
  {
    "id": 393,
    "wilaya_code": "14",
    "name": "مهدية"
  },
  {
    "id": 394,
    "wilaya_code": "14",
    "name": "مشرع الصفا"
  },
  {
    "id": 395,
    "wilaya_code": "14",
    "name": "مدريسة"
  },
  {
    "id": 396,
    "wilaya_code": "14",
    "name": "مدروسة"
  },
  {
    "id": 397,
    "wilaya_code": "14",
    "name": "مغيلة"
  },
  {
    "id": 398,
    "wilaya_code": "14",
    "name": "ملاكو"
  },
  {
    "id": 399,
    "wilaya_code": "14",
    "name": "الناظورة"
  },
  {
    "id": 400,
    "wilaya_code": "14",
    "name": "النعيمة"
  },
  {
    "id": 401,
    "wilaya_code": "14",
    "name": "وادي ليلي"
  },
  {
    "id": 402,
    "wilaya_code": "14",
    "name": "الرحوية"
  },
  {
    "id": 403,
    "wilaya_code": "14",
    "name": "السبعين"
  },
  {
    "id": 404,
    "wilaya_code": "14",
    "name": "السبت"
  },
  {
    "id": 405,
    "wilaya_code": "14",
    "name": "سي عبد الغني"
  },
  {
    "id": 406,
    "wilaya_code": "14",
    "name": "سيدي عبد الرحمن"
  },
  {
    "id": 407,
    "wilaya_code": "14",
    "name": "سيدي علي ملال"
  },
  {
    "id": 408,
    "wilaya_code": "14",
    "name": "سيدي بختي"
  },
  {
    "id": 409,
    "wilaya_code": "14",
    "name": "سيدي حسني"
  },
  {
    "id": 410,
    "wilaya_code": "14",
    "name": "السوقر"
  },
  {
    "id": 411,
    "wilaya_code": "14",
    "name": "تاقدمت"
  },
  {
    "id": 412,
    "wilaya_code": "14",
    "name": "تخمرت"
  },
  {
    "id": 413,
    "wilaya_code": "14",
    "name": "تيارت"
  },
  {
    "id": 414,
    "wilaya_code": "14",
    "name": "تيدة"
  },
  {
    "id": 415,
    "wilaya_code": "14",
    "name": "توسنينة"
  },
  {
    "id": 416,
    "wilaya_code": "15",
    "name": "أبي يوسف"
  },
  {
    "id": 417,
    "wilaya_code": "15",
    "name": "أغريب"
  },
  {
    "id": 418,
    "wilaya_code": "15",
    "name": "أقني قغران"
  },
  {
    "id": 419,
    "wilaya_code": "15",
    "name": "عين الحمام"
  },
  {
    "id": 420,
    "wilaya_code": "15",
    "name": "عين الزاوية"
  },
  {
    "id": 421,
    "wilaya_code": "15",
    "name": "أيت عقـواشة"
  },
  {
    "id": 422,
    "wilaya_code": "15",
    "name": "أيت بــوادو"
  },
  {
    "id": 423,
    "wilaya_code": "15",
    "name": "أيت بومهدي"
  },
  {
    "id": 424,
    "wilaya_code": "15",
    "name": "أيت خليلي"
  },
  {
    "id": 425,
    "wilaya_code": "15",
    "name": "أيت يحي موسى"
  },
  {
    "id": 426,
    "wilaya_code": "15",
    "name": "أيت عيسى ميمون"
  },
  {
    "id": 427,
    "wilaya_code": "15",
    "name": "أيت شافع"
  },
  {
    "id": 428,
    "wilaya_code": "15",
    "name": "أيت محمود"
  },
  {
    "id": 429,
    "wilaya_code": "15",
    "name": "أيت أومالو"
  },
  {
    "id": 430,
    "wilaya_code": "15",
    "name": "أيت تودرت"
  },
  {
    "id": 431,
    "wilaya_code": "15",
    "name": "أيت يحيى"
  },
  {
    "id": 432,
    "wilaya_code": "15",
    "name": "اقبيل"
  },
  {
    "id": 433,
    "wilaya_code": "15",
    "name": "أقرو"
  },
  {
    "id": 434,
    "wilaya_code": "15",
    "name": "أسي يوسف"
  },
  {
    "id": 435,
    "wilaya_code": "15",
    "name": "عزازقة"
  },
  {
    "id": 436,
    "wilaya_code": "15",
    "name": "أزفون"
  },
  {
    "id": 437,
    "wilaya_code": "15",
    "name": "بنــــي زمنزار"
  },
  {
    "id": 438,
    "wilaya_code": "15",
    "name": "بني عيسي"
  },
  {
    "id": 439,
    "wilaya_code": "15",
    "name": "بني دوالة"
  },
  {
    "id": 440,
    "wilaya_code": "15",
    "name": "بني يني"
  },
  {
    "id": 441,
    "wilaya_code": "15",
    "name": "بني زيكــي"
  },
  {
    "id": 442,
    "wilaya_code": "15",
    "name": "بوغني"
  },
  {
    "id": 443,
    "wilaya_code": "15",
    "name": "بوجيمة"
  },
  {
    "id": 444,
    "wilaya_code": "15",
    "name": "بونوح"
  },
  {
    "id": 445,
    "wilaya_code": "15",
    "name": "بوزقــن"
  },
  {
    "id": 446,
    "wilaya_code": "15",
    "name": "ذراع بن خدة"
  },
  {
    "id": 447,
    "wilaya_code": "15",
    "name": "ذراع الميزان"
  },
  {
    "id": 448,
    "wilaya_code": "15",
    "name": "فريحة"
  },
  {
    "id": 449,
    "wilaya_code": "15",
    "name": "فريقات"
  },
  {
    "id": 450,
    "wilaya_code": "15",
    "name": "إبودرارن"
  },
  {
    "id": 451,
    "wilaya_code": "15",
    "name": "إيجــار"
  },
  {
    "id": 452,
    "wilaya_code": "15",
    "name": "إفــرحــونان"
  },
  {
    "id": 453,
    "wilaya_code": "15",
    "name": "إيفيغاء"
  },
  {
    "id": 454,
    "wilaya_code": "15",
    "name": "إفليـــسن"
  },
  {
    "id": 455,
    "wilaya_code": "15",
    "name": "إيلـيــلتـن"
  },
  {
    "id": 456,
    "wilaya_code": "15",
    "name": "إيلولة أومـــالو"
  },
  {
    "id": 457,
    "wilaya_code": "15",
    "name": "إمســوحال"
  },
  {
    "id": 458,
    "wilaya_code": "15",
    "name": "إيرجـــن"
  },
  {
    "id": 459,
    "wilaya_code": "15",
    "name": "الأربعــاء ناث إيراثن"
  },
  {
    "id": 460,
    "wilaya_code": "15",
    "name": "مكيرة"
  },
  {
    "id": 461,
    "wilaya_code": "15",
    "name": "معـــاتقة"
  },
  {
    "id": 462,
    "wilaya_code": "15",
    "name": "ماكودة"
  },
  {
    "id": 463,
    "wilaya_code": "15",
    "name": "مشطراس"
  },
  {
    "id": 464,
    "wilaya_code": "15",
    "name": "مقــلع"
  },
  {
    "id": 465,
    "wilaya_code": "15",
    "name": "ميزرانـــة"
  },
  {
    "id": 466,
    "wilaya_code": "15",
    "name": "واسيف"
  },
  {
    "id": 467,
    "wilaya_code": "15",
    "name": "واضية"
  },
  {
    "id": 468,
    "wilaya_code": "15",
    "name": "واقنون"
  },
  {
    "id": 469,
    "wilaya_code": "15",
    "name": "سيدي نعمان"
  },
  {
    "id": 470,
    "wilaya_code": "15",
    "name": "صوامـــع"
  },
  {
    "id": 471,
    "wilaya_code": "15",
    "name": "سوق الاثنين"
  },
  {
    "id": 472,
    "wilaya_code": "15",
    "name": "تادمايت"
  },
  {
    "id": 473,
    "wilaya_code": "15",
    "name": "تيقـزيرت"
  },
  {
    "id": 474,
    "wilaya_code": "15",
    "name": "تيمـيزار"
  },
  {
    "id": 475,
    "wilaya_code": "15",
    "name": "تيرمتين"
  },
  {
    "id": 476,
    "wilaya_code": "15",
    "name": "تيزي نثلاثة"
  },
  {
    "id": 477,
    "wilaya_code": "15",
    "name": "تيزي غنيف"
  },
  {
    "id": 478,
    "wilaya_code": "15",
    "name": "تيزي وزو"
  },
  {
    "id": 479,
    "wilaya_code": "15",
    "name": "تيزي راشد"
  },
  {
    "id": 480,
    "wilaya_code": "15",
    "name": "إعــكورن"
  },
  {
    "id": 481,
    "wilaya_code": "15",
    "name": "يطــافن"
  },
  {
    "id": 482,
    "wilaya_code": "15",
    "name": "زكري"
  },
  {
    "id": 483,
    "wilaya_code": "16",
    "name": "عين بنيان"
  },
  {
    "id": 484,
    "wilaya_code": "16",
    "name": "عين طاية"
  },
  {
    "id": 485,
    "wilaya_code": "16",
    "name": "الجزائر الوسطى"
  },
  {
    "id": 486,
    "wilaya_code": "16",
    "name": "باب الوادي"
  },
  {
    "id": 487,
    "wilaya_code": "16",
    "name": "باب الزوار"
  },
  {
    "id": 488,
    "wilaya_code": "16",
    "name": "بابا حسن"
  },
  {
    "id": 489,
    "wilaya_code": "16",
    "name": "باش جراح"
  },
  {
    "id": 490,
    "wilaya_code": "16",
    "name": "براقي"
  },
  {
    "id": 491,
    "wilaya_code": "16",
    "name": "ابن عكنون"
  },
  {
    "id": 492,
    "wilaya_code": "16",
    "name": "بني مسوس"
  },
  {
    "id": 493,
    "wilaya_code": "16",
    "name": "بئر مراد رايس"
  },
  {
    "id": 494,
    "wilaya_code": "16",
    "name": "بئر توتة"
  },
  {
    "id": 495,
    "wilaya_code": "16",
    "name": "بئر خادم"
  },
  {
    "id": 496,
    "wilaya_code": "16",
    "name": "بولوغين بن زيري"
  },
  {
    "id": 497,
    "wilaya_code": "16",
    "name": "برج البحري"
  },
  {
    "id": 498,
    "wilaya_code": "16",
    "name": "برج الكيفان"
  },
  {
    "id": 499,
    "wilaya_code": "16",
    "name": "بوروبة"
  },
  {
    "id": 500,
    "wilaya_code": "16",
    "name": "بوزريعة"
  },
  {
    "id": 501,
    "wilaya_code": "16",
    "name": "القصبة"
  },
  {
    "id": 502,
    "wilaya_code": "16",
    "name": "الشراقة"
  },
  {
    "id": 503,
    "wilaya_code": "16",
    "name": "الدار البيضاء"
  },
  {
    "id": 504,
    "wilaya_code": "16",
    "name": "دالي ابراهيم"
  },
  {
    "id": 505,
    "wilaya_code": "16",
    "name": "جسر قسنطينة"
  },
  {
    "id": 506,
    "wilaya_code": "16",
    "name": "الدويرة"
  },
  {
    "id": 507,
    "wilaya_code": "16",
    "name": "الدرارية"
  },
  {
    "id": 508,
    "wilaya_code": "16",
    "name": "العاشور"
  },
  {
    "id": 509,
    "wilaya_code": "16",
    "name": "الابيار"
  },
  {
    "id": 510,
    "wilaya_code": "16",
    "name": "الحراش"
  },
  {
    "id": 511,
    "wilaya_code": "16",
    "name": "المدنية"
  },
  {
    "id": 512,
    "wilaya_code": "16",
    "name": "المغارية"
  },
  {
    "id": 513,
    "wilaya_code": "16",
    "name": "المرسى"
  },
  {
    "id": 514,
    "wilaya_code": "16",
    "name": "المرادية"
  },
  {
    "id": 515,
    "wilaya_code": "16",
    "name": "الحمامات"
  },
  {
    "id": 516,
    "wilaya_code": "16",
    "name": "هراوة"
  },
  {
    "id": 517,
    "wilaya_code": "16",
    "name": "حسين داي"
  },
  {
    "id": 518,
    "wilaya_code": "16",
    "name": "حيدرة"
  },
  {
    "id": 519,
    "wilaya_code": "16",
    "name": "الخرايسية"
  },
  {
    "id": 520,
    "wilaya_code": "16",
    "name": "القبة"
  },
  {
    "id": 521,
    "wilaya_code": "16",
    "name": "الكاليتوس"
  },
  {
    "id": 522,
    "wilaya_code": "16",
    "name": "المعالمة"
  },
  {
    "id": 523,
    "wilaya_code": "16",
    "name": "محمد بلوزداد"
  },
  {
    "id": 524,
    "wilaya_code": "16",
    "name": "المحمدية"
  },
  {
    "id": 525,
    "wilaya_code": "16",
    "name": "وادي قريش"
  },
  {
    "id": 526,
    "wilaya_code": "16",
    "name": "وادي السمار"
  },
  {
    "id": 527,
    "wilaya_code": "16",
    "name": "اولاد شبل"
  },
  {
    "id": 528,
    "wilaya_code": "16",
    "name": "اولاد فايت"
  },
  {
    "id": 529,
    "wilaya_code": "16",
    "name": "الرحمانية"
  },
  {
    "id": 530,
    "wilaya_code": "16",
    "name": "الرايس حميدو"
  },
  {
    "id": 531,
    "wilaya_code": "16",
    "name": "رغاية"
  },
  {
    "id": 532,
    "wilaya_code": "16",
    "name": "الرويبة"
  },
  {
    "id": 533,
    "wilaya_code": "16",
    "name": "السحاولة"
  },
  {
    "id": 534,
    "wilaya_code": "16",
    "name": "سيدي امحمد"
  },
  {
    "id": 535,
    "wilaya_code": "16",
    "name": "سيدي موسى"
  },
  {
    "id": 536,
    "wilaya_code": "16",
    "name": "سويدانية"
  },
  {
    "id": 537,
    "wilaya_code": "16",
    "name": "سطاوالي"
  },
  {
    "id": 538,
    "wilaya_code": "16",
    "name": "تسالة المرجة"
  },
  {
    "id": 539,
    "wilaya_code": "16",
    "name": "زرالدة"
  },
  {
    "id": 540,
    "wilaya_code": "17",
    "name": "عين الشهداء"
  },
  {
    "id": 541,
    "wilaya_code": "17",
    "name": "عين الإبل"
  },
  {
    "id": 542,
    "wilaya_code": "17",
    "name": "عين معبد"
  },
  {
    "id": 543,
    "wilaya_code": "17",
    "name": "بن يعقوب"
  },
  {
    "id": 544,
    "wilaya_code": "17",
    "name": "الشارف"
  },
  {
    "id": 545,
    "wilaya_code": "17",
    "name": "دار الشيوخ"
  },
  {
    "id": 546,
    "wilaya_code": "17",
    "name": "الجلفة"
  },
  {
    "id": 547,
    "wilaya_code": "17",
    "name": "دويس"
  },
  {
    "id": 548,
    "wilaya_code": "17",
    "name": "القديد"
  },
  {
    "id": 549,
    "wilaya_code": "17",
    "name": "الادريسية"
  },
  {
    "id": 550,
    "wilaya_code": "17",
    "name": "حاسي بحبح"
  },
  {
    "id": 551,
    "wilaya_code": "17",
    "name": "حاسي العش"
  },
  {
    "id": 552,
    "wilaya_code": "17",
    "name": "مليليحة"
  },
  {
    "id": 553,
    "wilaya_code": "17",
    "name": "مجبارة"
  },
  {
    "id": 554,
    "wilaya_code": "17",
    "name": "سيدي بايزيد"
  },
  {
    "id": 555,
    "wilaya_code": "17",
    "name": "تعظميت"
  },
  {
    "id": 556,
    "wilaya_code": "17",
    "name": "زعفران"
  },
  {
    "id": 557,
    "wilaya_code": "17",
    "name": "زكار"
  },
  {
    "id": 558,
    "wilaya_code": "18",
    "name": "برج الطهر"
  },
  {
    "id": 559,
    "wilaya_code": "18",
    "name": "بودريعة بني ياجيس"
  },
  {
    "id": 560,
    "wilaya_code": "18",
    "name": "بوراوي بلهادف"
  },
  {
    "id": 561,
    "wilaya_code": "18",
    "name": "بوسيف أولاد عسكر"
  },
  {
    "id": 562,
    "wilaya_code": "18",
    "name": "الشحنة"
  },
  {
    "id": 563,
    "wilaya_code": "18",
    "name": "الشقفة"
  },
  {
    "id": 564,
    "wilaya_code": "18",
    "name": "الجمعة بني حبيبي"
  },
  {
    "id": 565,
    "wilaya_code": "18",
    "name": "جيملة"
  },
  {
    "id": 566,
    "wilaya_code": "18",
    "name": "العنصر"
  },
  {
    "id": 567,
    "wilaya_code": "18",
    "name": "العوانة"
  },
  {
    "id": 568,
    "wilaya_code": "18",
    "name": "القنار نشفي"
  },
  {
    "id": 569,
    "wilaya_code": "18",
    "name": "الميلية"
  },
  {
    "id": 570,
    "wilaya_code": "18",
    "name": "الامير عبد القادر"
  },
  {
    "id": 571,
    "wilaya_code": "18",
    "name": "أراقن سويسي"
  },
  {
    "id": 572,
    "wilaya_code": "18",
    "name": "غبالة"
  },
  {
    "id": 573,
    "wilaya_code": "18",
    "name": "جيجل"
  },
  {
    "id": 574,
    "wilaya_code": "18",
    "name": "قاوس"
  },
  {
    "id": 575,
    "wilaya_code": "18",
    "name": "خيري واد عجول"
  },
  {
    "id": 576,
    "wilaya_code": "18",
    "name": "وجانة"
  },
  {
    "id": 577,
    "wilaya_code": "18",
    "name": "أولاد رابح"
  },
  {
    "id": 578,
    "wilaya_code": "18",
    "name": "أولاد يحيى خدروش"
  },
  {
    "id": 579,
    "wilaya_code": "18",
    "name": "سلمى بن زيادة"
  },
  {
    "id": 580,
    "wilaya_code": "18",
    "name": "السطارة"
  },
  {
    "id": 581,
    "wilaya_code": "18",
    "name": "سيدي عبد العزيز"
  },
  {
    "id": 582,
    "wilaya_code": "18",
    "name": "سيدي معروف"
  },
  {
    "id": 583,
    "wilaya_code": "18",
    "name": "الطاهير"
  },
  {
    "id": 584,
    "wilaya_code": "18",
    "name": "تاكسنة"
  },
  {
    "id": 585,
    "wilaya_code": "18",
    "name": "زيامة منصورية"
  },
  {
    "id": 586,
    "wilaya_code": "19",
    "name": "عين عباسة"
  },
  {
    "id": 587,
    "wilaya_code": "19",
    "name": "عين أرنات"
  },
  {
    "id": 588,
    "wilaya_code": "19",
    "name": "عين أزال"
  },
  {
    "id": 589,
    "wilaya_code": "19",
    "name": "عين الكبيرة"
  },
  {
    "id": 590,
    "wilaya_code": "19",
    "name": "عين الحجر"
  },
  {
    "id": 591,
    "wilaya_code": "19",
    "name": "عين ولمان"
  },
  {
    "id": 592,
    "wilaya_code": "19",
    "name": "عين لقراج"
  },
  {
    "id": 593,
    "wilaya_code": "19",
    "name": "عين الروى"
  },
  {
    "id": 594,
    "wilaya_code": "19",
    "name": "عين السبت"
  },
  {
    "id": 595,
    "wilaya_code": "19",
    "name": "أيت نوال مزادة"
  },
  {
    "id": 596,
    "wilaya_code": "19",
    "name": "ايت تيزي"
  },
  {
    "id": 597,
    "wilaya_code": "19",
    "name": "عموشة"
  },
  {
    "id": 598,
    "wilaya_code": "19",
    "name": "بابور"
  },
  {
    "id": 599,
    "wilaya_code": "19",
    "name": "بازر سكرة"
  },
  {
    "id": 600,
    "wilaya_code": "19",
    "name": "بيضاء برج"
  },
  {
    "id": 601,
    "wilaya_code": "19",
    "name": "بلاعة"
  },
  {
    "id": 602,
    "wilaya_code": "19",
    "name": "بني شبانة"
  },
  {
    "id": 603,
    "wilaya_code": "19",
    "name": "بني فودة"
  },
  {
    "id": 604,
    "wilaya_code": "19",
    "name": "بني ورتيلان"
  },
  {
    "id": 605,
    "wilaya_code": "19",
    "name": "بني وسين"
  },
  {
    "id": 606,
    "wilaya_code": "19",
    "name": "بني عزيز"
  },
  {
    "id": 607,
    "wilaya_code": "19",
    "name": "بني موحلي"
  },
  {
    "id": 608,
    "wilaya_code": "19",
    "name": "بئر حدادة"
  },
  {
    "id": 609,
    "wilaya_code": "19",
    "name": "بئر العرش"
  },
  {
    "id": 610,
    "wilaya_code": "19",
    "name": "بوعنداس"
  },
  {
    "id": 611,
    "wilaya_code": "19",
    "name": "بوقاعة"
  },
  {
    "id": 612,
    "wilaya_code": "19",
    "name": "بوسلام"
  },
  {
    "id": 613,
    "wilaya_code": "19",
    "name": "بوطالب"
  },
  {
    "id": 614,
    "wilaya_code": "19",
    "name": "الدهامشة"
  },
  {
    "id": 615,
    "wilaya_code": "19",
    "name": "جميلة"
  },
  {
    "id": 616,
    "wilaya_code": "19",
    "name": "ذراع قبيلة"
  },
  {
    "id": 617,
    "wilaya_code": "19",
    "name": "العلمة"
  },
  {
    "id": 618,
    "wilaya_code": "19",
    "name": "أوريسيا"
  },
  {
    "id": 619,
    "wilaya_code": "19",
    "name": "الولجة"
  },
  {
    "id": 620,
    "wilaya_code": "19",
    "name": "قلال"
  },
  {
    "id": 621,
    "wilaya_code": "19",
    "name": "قلتة زرقاء"
  },
  {
    "id": 622,
    "wilaya_code": "19",
    "name": "قنزات"
  },
  {
    "id": 623,
    "wilaya_code": "19",
    "name": "قجال"
  },
  {
    "id": 624,
    "wilaya_code": "19",
    "name": "حمام السخنة"
  },
  {
    "id": 625,
    "wilaya_code": "19",
    "name": "الحامة"
  },
  {
    "id": 626,
    "wilaya_code": "19",
    "name": "حمام قرقور"
  },
  {
    "id": 627,
    "wilaya_code": "19",
    "name": "حربيل"
  },
  {
    "id": 628,
    "wilaya_code": "19",
    "name": "قصر الابطال"
  },
  {
    "id": 629,
    "wilaya_code": "19",
    "name": "معاوية"
  },
  {
    "id": 630,
    "wilaya_code": "19",
    "name": "ماوكلان"
  },
  {
    "id": 631,
    "wilaya_code": "19",
    "name": "مزلوق"
  },
  {
    "id": 632,
    "wilaya_code": "19",
    "name": "واد البارد"
  },
  {
    "id": 633,
    "wilaya_code": "19",
    "name": "أولاد عدوان"
  },
  {
    "id": 634,
    "wilaya_code": "19",
    "name": "أولاد صابر"
  },
  {
    "id": 635,
    "wilaya_code": "19",
    "name": "أولاد سي أحمد"
  },
  {
    "id": 636,
    "wilaya_code": "19",
    "name": "أولاد تبان"
  },
  {
    "id": 637,
    "wilaya_code": "19",
    "name": "الرصفة"
  },
  {
    "id": 638,
    "wilaya_code": "19",
    "name": "صالح باي"
  },
  {
    "id": 639,
    "wilaya_code": "19",
    "name": "سرج الغول"
  },
  {
    "id": 640,
    "wilaya_code": "19",
    "name": "سطيف"
  },
  {
    "id": 641,
    "wilaya_code": "19",
    "name": "تاشودة"
  },
  {
    "id": 642,
    "wilaya_code": "19",
    "name": "تالة إيفاسن"
  },
  {
    "id": 643,
    "wilaya_code": "19",
    "name": "الطاية"
  },
  {
    "id": 644,
    "wilaya_code": "19",
    "name": "التلة"
  },
  {
    "id": 645,
    "wilaya_code": "19",
    "name": "تيزي نبشار"
  },
  {
    "id": 646,
    "wilaya_code": "20",
    "name": "عين الحجر"
  },
  {
    "id": 647,
    "wilaya_code": "20",
    "name": "عين السخونة"
  },
  {
    "id": 648,
    "wilaya_code": "20",
    "name": "عين السلطان"
  },
  {
    "id": 649,
    "wilaya_code": "20",
    "name": "دوي ثابت"
  },
  {
    "id": 650,
    "wilaya_code": "20",
    "name": "الحساسنة"
  },
  {
    "id": 651,
    "wilaya_code": "20",
    "name": "هونت"
  },
  {
    "id": 652,
    "wilaya_code": "20",
    "name": "المعمورة"
  },
  {
    "id": 653,
    "wilaya_code": "20",
    "name": "مولاي العربي"
  },
  {
    "id": 654,
    "wilaya_code": "20",
    "name": "أولاد إبراهيم"
  },
  {
    "id": 655,
    "wilaya_code": "20",
    "name": "أولاد خالد"
  },
  {
    "id": 656,
    "wilaya_code": "20",
    "name": "سعيدة"
  },
  {
    "id": 657,
    "wilaya_code": "20",
    "name": "سيدي احمد"
  },
  {
    "id": 658,
    "wilaya_code": "20",
    "name": "سيدي عمر"
  },
  {
    "id": 659,
    "wilaya_code": "20",
    "name": "سيدي بوبكر"
  },
  {
    "id": 660,
    "wilaya_code": "20",
    "name": "تيرسين"
  },
  {
    "id": 661,
    "wilaya_code": "20",
    "name": "يوب"
  },
  {
    "id": 662,
    "wilaya_code": "21",
    "name": "عين بوزيان"
  },
  {
    "id": 663,
    "wilaya_code": "21",
    "name": "عين شرشار"
  },
  {
    "id": 664,
    "wilaya_code": "21",
    "name": "عين قشرة"
  },
  {
    "id": 665,
    "wilaya_code": "21",
    "name": "عين زويت"
  },
  {
    "id": 666,
    "wilaya_code": "21",
    "name": "عزابة"
  },
  {
    "id": 667,
    "wilaya_code": "21",
    "name": "بكوش لخضر"
  },
  {
    "id": 668,
    "wilaya_code": "21",
    "name": "بن عزوز"
  },
  {
    "id": 669,
    "wilaya_code": "21",
    "name": "بني بشير"
  },
  {
    "id": 670,
    "wilaya_code": "21",
    "name": "بني ولبان"
  },
  {
    "id": 671,
    "wilaya_code": "21",
    "name": "بني زيد"
  },
  {
    "id": 672,
    "wilaya_code": "21",
    "name": "بين الويدان"
  },
  {
    "id": 673,
    "wilaya_code": "21",
    "name": "بوشطاطة"
  },
  {
    "id": 674,
    "wilaya_code": "21",
    "name": "الشرايع"
  },
  {
    "id": 675,
    "wilaya_code": "21",
    "name": "القل"
  },
  {
    "id": 676,
    "wilaya_code": "21",
    "name": "جندل سعدي محمد"
  },
  {
    "id": 677,
    "wilaya_code": "21",
    "name": "الحروش"
  },
  {
    "id": 678,
    "wilaya_code": "21",
    "name": "الغدير"
  },
  {
    "id": 679,
    "wilaya_code": "21",
    "name": "الحدائق"
  },
  {
    "id": 680,
    "wilaya_code": "21",
    "name": "المرسى"
  },
  {
    "id": 681,
    "wilaya_code": "21",
    "name": "مجاز الدشيش"
  },
  {
    "id": 682,
    "wilaya_code": "21",
    "name": "السبت"
  },
  {
    "id": 683,
    "wilaya_code": "21",
    "name": "فلفلة"
  },
  {
    "id": 684,
    "wilaya_code": "21",
    "name": "حمادي كرومة"
  },
  {
    "id": 685,
    "wilaya_code": "21",
    "name": "قنواع"
  },
  {
    "id": 686,
    "wilaya_code": "21",
    "name": "الكركرة"
  },
  {
    "id": 687,
    "wilaya_code": "21",
    "name": "خناق مايو"
  },
  {
    "id": 688,
    "wilaya_code": "21",
    "name": "وادي الزهور"
  },
  {
    "id": 689,
    "wilaya_code": "21",
    "name": "الولجة بولبلوط"
  },
  {
    "id": 690,
    "wilaya_code": "21",
    "name": "أولاد عطية"
  },
  {
    "id": 691,
    "wilaya_code": "21",
    "name": "أولاد حبابة"
  },
  {
    "id": 692,
    "wilaya_code": "21",
    "name": "أم الطوب"
  },
  {
    "id": 693,
    "wilaya_code": "21",
    "name": "رمضان جمال"
  },
  {
    "id": 694,
    "wilaya_code": "21",
    "name": "صالح بو الشعور"
  },
  {
    "id": 695,
    "wilaya_code": "21",
    "name": "سيدي مزغيش"
  },
  {
    "id": 696,
    "wilaya_code": "21",
    "name": "سكيكدة"
  },
  {
    "id": 697,
    "wilaya_code": "21",
    "name": "تمالوس"
  },
  {
    "id": 698,
    "wilaya_code": "21",
    "name": "زردازة"
  },
  {
    "id": 699,
    "wilaya_code": "21",
    "name": "الزيتونة"
  },
  {
    "id": 700,
    "wilaya_code": "22",
    "name": "عين البرد"
  },
  {
    "id": 701,
    "wilaya_code": "22",
    "name": "عين قادة"
  },
  {
    "id": 702,
    "wilaya_code": "22",
    "name": "عين الثريد"
  },
  {
    "id": 703,
    "wilaya_code": "22",
    "name": "عين تندمين"
  },
  {
    "id": 704,
    "wilaya_code": "22",
    "name": "عين أدن"
  },
  {
    "id": 705,
    "wilaya_code": "22",
    "name": "العمارنة"
  },
  {
    "id": 706,
    "wilaya_code": "22",
    "name": "بضرابين المقراني"
  },
  {
    "id": 707,
    "wilaya_code": "22",
    "name": "بلعربي"
  },
  {
    "id": 708,
    "wilaya_code": "22",
    "name": "بن باديس"
  },
  {
    "id": 709,
    "wilaya_code": "22",
    "name": "بن عشيبة شلية"
  },
  {
    "id": 710,
    "wilaya_code": "22",
    "name": "بئر الحمام"
  },
  {
    "id": 711,
    "wilaya_code": "22",
    "name": "بوجبهة البرج"
  },
  {
    "id": 712,
    "wilaya_code": "22",
    "name": "بوخنفيس"
  },
  {
    "id": 713,
    "wilaya_code": "22",
    "name": "شيطوان البلايلة"
  },
  {
    "id": 714,
    "wilaya_code": "22",
    "name": "الضاية"
  },
  {
    "id": 715,
    "wilaya_code": "22",
    "name": "الحصيبة"
  },
  {
    "id": 716,
    "wilaya_code": "22",
    "name": "حاسي دحو"
  },
  {
    "id": 717,
    "wilaya_code": "22",
    "name": "حاسي زهانة"
  },
  {
    "id": 718,
    "wilaya_code": "22",
    "name": "لمطار"
  },
  {
    "id": 719,
    "wilaya_code": "22",
    "name": "مسيد"
  },
  {
    "id": 720,
    "wilaya_code": "22",
    "name": "مكدرة"
  },
  {
    "id": 721,
    "wilaya_code": "22",
    "name": "مرحوم"
  },
  {
    "id": 722,
    "wilaya_code": "22",
    "name": "مرين"
  },
  {
    "id": 723,
    "wilaya_code": "22",
    "name": "مزاورو"
  },
  {
    "id": 724,
    "wilaya_code": "22",
    "name": "مصطفى بن ابراهيم"
  },
  {
    "id": 725,
    "wilaya_code": "22",
    "name": "مولاي سليسن"
  },
  {
    "id": 726,
    "wilaya_code": "22",
    "name": "وادي السبع"
  },
  {
    "id": 727,
    "wilaya_code": "22",
    "name": "وادي سفيون"
  },
  {
    "id": 728,
    "wilaya_code": "22",
    "name": "وادي تاوريرة"
  },
  {
    "id": 729,
    "wilaya_code": "22",
    "name": "راس الماء"
  },
  {
    "id": 730,
    "wilaya_code": "22",
    "name": "رجم دموش"
  },
  {
    "id": 731,
    "wilaya_code": "22",
    "name": "السهالة الثورة"
  },
  {
    "id": 732,
    "wilaya_code": "22",
    "name": "سفيزف"
  },
  {
    "id": 733,
    "wilaya_code": "22",
    "name": "سيدي علي بن يوب"
  },
  {
    "id": 734,
    "wilaya_code": "22",
    "name": "سيدي علي بوسيدي"
  },
  {
    "id": 735,
    "wilaya_code": "22",
    "name": "سيدي بلعباس"
  },
  {
    "id": 736,
    "wilaya_code": "22",
    "name": "سيدي ابراهيم"
  },
  {
    "id": 737,
    "wilaya_code": "22",
    "name": "سيدي شعيب"
  },
  {
    "id": 738,
    "wilaya_code": "22",
    "name": "سيدي دحو الزاير"
  },
  {
    "id": 739,
    "wilaya_code": "22",
    "name": "سيدي حمادوش"
  },
  {
    "id": 740,
    "wilaya_code": "22",
    "name": "سيدي خالد"
  },
  {
    "id": 741,
    "wilaya_code": "22",
    "name": "سيدي لحسن"
  },
  {
    "id": 742,
    "wilaya_code": "22",
    "name": "سيدي يعقوب"
  },
  {
    "id": 743,
    "wilaya_code": "22",
    "name": "طابية"
  },
  {
    "id": 744,
    "wilaya_code": "22",
    "name": "تاودموت"
  },
  {
    "id": 745,
    "wilaya_code": "22",
    "name": "تفسور"
  },
  {
    "id": 746,
    "wilaya_code": "22",
    "name": "تغاليمت"
  },
  {
    "id": 747,
    "wilaya_code": "22",
    "name": "تلاغ"
  },
  {
    "id": 748,
    "wilaya_code": "22",
    "name": "تنيرة"
  },
  {
    "id": 749,
    "wilaya_code": "22",
    "name": "تسالة"
  },
  {
    "id": 750,
    "wilaya_code": "22",
    "name": "تلموني"
  },
  {
    "id": 751,
    "wilaya_code": "22",
    "name": "زروالة"
  },
  {
    "id": 752,
    "wilaya_code": "23",
    "name": "عين الباردة"
  },
  {
    "id": 753,
    "wilaya_code": "23",
    "name": "عنابة"
  },
  {
    "id": 754,
    "wilaya_code": "23",
    "name": "برحال"
  },
  {
    "id": 755,
    "wilaya_code": "23",
    "name": "شطايبي"
  },
  {
    "id": 756,
    "wilaya_code": "23",
    "name": "الشرفة"
  },
  {
    "id": 757,
    "wilaya_code": "23",
    "name": "البوني"
  },
  {
    "id": 758,
    "wilaya_code": "23",
    "name": "العلمة"
  },
  {
    "id": 759,
    "wilaya_code": "23",
    "name": "الحجار"
  },
  {
    "id": 760,
    "wilaya_code": "23",
    "name": "واد العنب"
  },
  {
    "id": 761,
    "wilaya_code": "23",
    "name": "سرايدي"
  },
  {
    "id": 762,
    "wilaya_code": "23",
    "name": "سيدي عمار"
  },
  {
    "id": 763,
    "wilaya_code": "23",
    "name": "التريعات"
  },
  {
    "id": 764,
    "wilaya_code": "24",
    "name": "عين بن بيضاء"
  },
  {
    "id": 765,
    "wilaya_code": "24",
    "name": "عين العربي"
  },
  {
    "id": 766,
    "wilaya_code": "24",
    "name": "عين مخلوف"
  },
  {
    "id": 767,
    "wilaya_code": "24",
    "name": "عين رقادة"
  },
  {
    "id": 768,
    "wilaya_code": "24",
    "name": "عين صندل"
  },
  {
    "id": 769,
    "wilaya_code": "24",
    "name": "بلخير"
  },
  {
    "id": 770,
    "wilaya_code": "24",
    "name": "بن جراح"
  },
  {
    "id": 771,
    "wilaya_code": "24",
    "name": "بني مزلين"
  },
  {
    "id": 772,
    "wilaya_code": "24",
    "name": "برج صباط"
  },
  {
    "id": 773,
    "wilaya_code": "24",
    "name": "بوحشانة"
  },
  {
    "id": 774,
    "wilaya_code": "24",
    "name": "بوحمدان"
  },
  {
    "id": 775,
    "wilaya_code": "24",
    "name": "بوعاتي محمود"
  },
  {
    "id": 776,
    "wilaya_code": "24",
    "name": "بوشقوف"
  },
  {
    "id": 777,
    "wilaya_code": "24",
    "name": "بومهرة أحمد"
  },
  {
    "id": 778,
    "wilaya_code": "24",
    "name": "الدهوارة"
  },
  {
    "id": 779,
    "wilaya_code": "24",
    "name": "جبالة الخميسي"
  },
  {
    "id": 780,
    "wilaya_code": "24",
    "name": "الفجوج"
  },
  {
    "id": 781,
    "wilaya_code": "24",
    "name": "قلعة بوصبع"
  },
  {
    "id": 782,
    "wilaya_code": "24",
    "name": "قالمة"
  },
  {
    "id": 783,
    "wilaya_code": "24",
    "name": "حمام دباغ"
  },
  {
    "id": 784,
    "wilaya_code": "24",
    "name": "حمام النبايل"
  },
  {
    "id": 785,
    "wilaya_code": "24",
    "name": "هيليوبوليس"
  },
  {
    "id": 786,
    "wilaya_code": "24",
    "name": "هواري بومدين"
  },
  {
    "id": 787,
    "wilaya_code": "24",
    "name": "لخزارة"
  },
  {
    "id": 788,
    "wilaya_code": "24",
    "name": "مجاز عمار"
  },
  {
    "id": 789,
    "wilaya_code": "24",
    "name": "مجاز الصفاء"
  },
  {
    "id": 790,
    "wilaya_code": "24",
    "name": "نشماية"
  },
  {
    "id": 791,
    "wilaya_code": "24",
    "name": "وادي الشحم"
  },
  {
    "id": 792,
    "wilaya_code": "24",
    "name": "وادي فراغة"
  },
  {
    "id": 793,
    "wilaya_code": "24",
    "name": "وادي الزناتي"
  },
  {
    "id": 794,
    "wilaya_code": "24",
    "name": "رأس العقبة"
  },
  {
    "id": 795,
    "wilaya_code": "24",
    "name": "الركنية"
  },
  {
    "id": 796,
    "wilaya_code": "24",
    "name": "سلاوة عنونة"
  },
  {
    "id": 797,
    "wilaya_code": "24",
    "name": "تاملوكة"
  },
  {
    "id": 798,
    "wilaya_code": "25",
    "name": "عين عبيد"
  },
  {
    "id": 799,
    "wilaya_code": "25",
    "name": "عين السمارة"
  },
  {
    "id": 800,
    "wilaya_code": "25",
    "name": "ابن باديس"
  },
  {
    "id": 801,
    "wilaya_code": "25",
    "name": "بني حميدان"
  },
  {
    "id": 802,
    "wilaya_code": "25",
    "name": "قسنطينة"
  },
  {
    "id": 803,
    "wilaya_code": "25",
    "name": "ديدوش مراد"
  },
  {
    "id": 804,
    "wilaya_code": "25",
    "name": "الخروب"
  },
  {
    "id": 805,
    "wilaya_code": "25",
    "name": "حامة بوزيان"
  },
  {
    "id": 806,
    "wilaya_code": "25",
    "name": "ابن زياد"
  },
  {
    "id": 807,
    "wilaya_code": "25",
    "name": "بوجريو مسعود"
  },
  {
    "id": 808,
    "wilaya_code": "25",
    "name": "أولاد رحمون"
  },
  {
    "id": 809,
    "wilaya_code": "25",
    "name": "زيغود يوسف"
  },
  {
    "id": 810,
    "wilaya_code": "26",
    "name": "العيساوية"
  },
  {
    "id": 811,
    "wilaya_code": "26",
    "name": "بعطة"
  },
  {
    "id": 812,
    "wilaya_code": "26",
    "name": "بن شكاو"
  },
  {
    "id": 813,
    "wilaya_code": "26",
    "name": "بني سليمان"
  },
  {
    "id": 814,
    "wilaya_code": "26",
    "name": "البرواقية"
  },
  {
    "id": 815,
    "wilaya_code": "26",
    "name": "بئر بن عابد"
  },
  {
    "id": 816,
    "wilaya_code": "26",
    "name": "بوعيشون"
  },
  {
    "id": 817,
    "wilaya_code": "26",
    "name": "بوشراحيل"
  },
  {
    "id": 818,
    "wilaya_code": "26",
    "name": "بوسكن"
  },
  {
    "id": 819,
    "wilaya_code": "26",
    "name": "جواب"
  },
  {
    "id": 820,
    "wilaya_code": "26",
    "name": "ذراع السمار"
  },
  {
    "id": 821,
    "wilaya_code": "26",
    "name": "العزيزية"
  },
  {
    "id": 822,
    "wilaya_code": "26",
    "name": "القلب الكبير"
  },
  {
    "id": 823,
    "wilaya_code": "26",
    "name": "الحمدانية"
  },
  {
    "id": 824,
    "wilaya_code": "26",
    "name": "الحوضان"
  },
  {
    "id": 825,
    "wilaya_code": "26",
    "name": "العمارية"
  },
  {
    "id": 826,
    "wilaya_code": "26",
    "name": "حناشة"
  },
  {
    "id": 827,
    "wilaya_code": "26",
    "name": "خمس جوامع"
  },
  {
    "id": 828,
    "wilaya_code": "26",
    "name": "مغراوة"
  },
  {
    "id": 829,
    "wilaya_code": "26",
    "name": "المدية"
  },
  {
    "id": 830,
    "wilaya_code": "26",
    "name": "مجبر"
  },
  {
    "id": 831,
    "wilaya_code": "26",
    "name": "مزغنة"
  },
  {
    "id": 832,
    "wilaya_code": "26",
    "name": "ميهوب"
  },
  {
    "id": 833,
    "wilaya_code": "26",
    "name": "عوامري"
  },
  {
    "id": 834,
    "wilaya_code": "26",
    "name": "وادي حربيل"
  },
  {
    "id": 835,
    "wilaya_code": "26",
    "name": "أولاد بوعشرة"
  },
  {
    "id": 836,
    "wilaya_code": "26",
    "name": "أولاد إبراهيم"
  },
  {
    "id": 837,
    "wilaya_code": "26",
    "name": "أولاد دايد"
  },
  {
    "id": 838,
    "wilaya_code": "26",
    "name": "وزرة"
  },
  {
    "id": 839,
    "wilaya_code": "26",
    "name": "الربعية"
  },
  {
    "id": 840,
    "wilaya_code": "26",
    "name": "سدراية"
  },
  {
    "id": 841,
    "wilaya_code": "26",
    "name": "سغوان"
  },
  {
    "id": 842,
    "wilaya_code": "26",
    "name": "سي المحجوب"
  },
  {
    "id": 843,
    "wilaya_code": "26",
    "name": "سيدي نعمان"
  },
  {
    "id": 844,
    "wilaya_code": "26",
    "name": "سيدي الربيع"
  },
  {
    "id": 845,
    "wilaya_code": "26",
    "name": "سيدي زهار"
  },
  {
    "id": 846,
    "wilaya_code": "26",
    "name": "سيدي زيان"
  },
  {
    "id": 847,
    "wilaya_code": "26",
    "name": "السواقي"
  },
  {
    "id": 848,
    "wilaya_code": "26",
    "name": "تابلاط"
  },
  {
    "id": 849,
    "wilaya_code": "26",
    "name": "تمسقيدة"
  },
  {
    "id": 850,
    "wilaya_code": "26",
    "name": "تيزي مهدي"
  },
  {
    "id": 851,
    "wilaya_code": "26",
    "name": "ثلاث دوائر"
  },
  {
    "id": 852,
    "wilaya_code": "26",
    "name": "الزبيرية"
  },
  {
    "id": 853,
    "wilaya_code": "27",
    "name": "عشعاشة"
  },
  {
    "id": 854,
    "wilaya_code": "27",
    "name": "عين بودينار"
  },
  {
    "id": 855,
    "wilaya_code": "27",
    "name": "عين نويسي"
  },
  {
    "id": 856,
    "wilaya_code": "27",
    "name": "عين سيدي الشريف"
  },
  {
    "id": 857,
    "wilaya_code": "27",
    "name": "عين تادلس"
  },
  {
    "id": 858,
    "wilaya_code": "27",
    "name": "بن عبد المالك رمضان"
  },
  {
    "id": 859,
    "wilaya_code": "27",
    "name": "بوقيراط"
  },
  {
    "id": 860,
    "wilaya_code": "27",
    "name": "فرناقة"
  },
  {
    "id": 861,
    "wilaya_code": "27",
    "name": "حجاج"
  },
  {
    "id": 862,
    "wilaya_code": "27",
    "name": "حاسي ماماش"
  },
  {
    "id": 863,
    "wilaya_code": "27",
    "name": "الحسيان (بني ياحي"
  },
  {
    "id": 864,
    "wilaya_code": "27",
    "name": "خضرة"
  },
  {
    "id": 865,
    "wilaya_code": "27",
    "name": "خير الدين"
  },
  {
    "id": 866,
    "wilaya_code": "27",
    "name": "منصورة"
  },
  {
    "id": 867,
    "wilaya_code": "27",
    "name": "مزغران"
  },
  {
    "id": 868,
    "wilaya_code": "27",
    "name": "ماسرة"
  },
  {
    "id": 869,
    "wilaya_code": "27",
    "name": "مستغانم"
  },
  {
    "id": 870,
    "wilaya_code": "27",
    "name": "نكمارية"
  },
  {
    "id": 871,
    "wilaya_code": "27",
    "name": "وادي الخير"
  },
  {
    "id": 872,
    "wilaya_code": "27",
    "name": "أولاد بوغالم"
  },
  {
    "id": 873,
    "wilaya_code": "27",
    "name": "أولاد مع الله"
  },
  {
    "id": 874,
    "wilaya_code": "27",
    "name": "صفصاف"
  },
  {
    "id": 875,
    "wilaya_code": "27",
    "name": "صيادة"
  },
  {
    "id": 876,
    "wilaya_code": "27",
    "name": "سيدي علي"
  },
  {
    "id": 877,
    "wilaya_code": "27",
    "name": "سيدي بلعطار"
  },
  {
    "id": 878,
    "wilaya_code": "27",
    "name": "سيدي لخضر"
  },
  {
    "id": 879,
    "wilaya_code": "27",
    "name": "سيرات"
  },
  {
    "id": 880,
    "wilaya_code": "27",
    "name": "السوافلية"
  },
  {
    "id": 881,
    "wilaya_code": "27",
    "name": "سور"
  },
  {
    "id": 882,
    "wilaya_code": "27",
    "name": "ستيدية"
  },
  {
    "id": 883,
    "wilaya_code": "27",
    "name": "تزقايت"
  },
  {
    "id": 884,
    "wilaya_code": "27",
    "name": "الطواهرية"
  },
  {
    "id": 885,
    "wilaya_code": "28",
    "name": "عين الحجل"
  },
  {
    "id": 886,
    "wilaya_code": "28",
    "name": "عين الخضراء"
  },
  {
    "id": 887,
    "wilaya_code": "28",
    "name": "بلعايبة"
  },
  {
    "id": 888,
    "wilaya_code": "28",
    "name": "بني يلمان"
  },
  {
    "id": 889,
    "wilaya_code": "28",
    "name": "برهوم"
  },
  {
    "id": 890,
    "wilaya_code": "28",
    "name": "بوطي السايح"
  },
  {
    "id": 891,
    "wilaya_code": "28",
    "name": "شلال"
  },
  {
    "id": 892,
    "wilaya_code": "28",
    "name": "دهاهنة"
  },
  {
    "id": 893,
    "wilaya_code": "28",
    "name": "حمام الضلعة"
  },
  {
    "id": 894,
    "wilaya_code": "28",
    "name": "خطوطي سد الجير"
  },
  {
    "id": 895,
    "wilaya_code": "28",
    "name": "المسيلة"
  },
  {
    "id": 896,
    "wilaya_code": "28",
    "name": "المطارفة"
  },
  {
    "id": 897,
    "wilaya_code": "28",
    "name": "المعاضيد"
  },
  {
    "id": 898,
    "wilaya_code": "28",
    "name": "معاريف"
  },
  {
    "id": 899,
    "wilaya_code": "28",
    "name": "مقرة"
  },
  {
    "id": 900,
    "wilaya_code": "28",
    "name": "ونوغة"
  },
  {
    "id": 901,
    "wilaya_code": "28",
    "name": "أولاد عدي لقبالة"
  },
  {
    "id": 902,
    "wilaya_code": "28",
    "name": "أولاد دراج"
  },
  {
    "id": 903,
    "wilaya_code": "28",
    "name": "أولاد ماضي"
  },
  {
    "id": 904,
    "wilaya_code": "28",
    "name": "أولاد منصور"
  },
  {
    "id": 905,
    "wilaya_code": "28",
    "name": "سيدي عيسى"
  },
  {
    "id": 906,
    "wilaya_code": "28",
    "name": "سيدي هجرس"
  },
  {
    "id": 907,
    "wilaya_code": "28",
    "name": "السوامع"
  },
  {
    "id": 908,
    "wilaya_code": "28",
    "name": "تارمونت"
  },
  {
    "id": 909,
    "wilaya_code": "29",
    "name": "عين فارس"
  },
  {
    "id": 910,
    "wilaya_code": "29",
    "name": "عين فكان"
  },
  {
    "id": 911,
    "wilaya_code": "29",
    "name": "عين فراح"
  },
  {
    "id": 912,
    "wilaya_code": "29",
    "name": "عين أفرص"
  },
  {
    "id": 913,
    "wilaya_code": "29",
    "name": "العلايمية"
  },
  {
    "id": 914,
    "wilaya_code": "29",
    "name": "عوف"
  },
  {
    "id": 915,
    "wilaya_code": "29",
    "name": "بنيان"
  },
  {
    "id": 916,
    "wilaya_code": "29",
    "name": "بوهني"
  },
  {
    "id": 917,
    "wilaya_code": "29",
    "name": "بوحنيفية"
  },
  {
    "id": 918,
    "wilaya_code": "29",
    "name": "الشرفاء"
  },
  {
    "id": 919,
    "wilaya_code": "29",
    "name": "البرج"
  },
  {
    "id": 920,
    "wilaya_code": "29",
    "name": "القعدة"
  },
  {
    "id": 921,
    "wilaya_code": "29",
    "name": "الغمري"
  },
  {
    "id": 922,
    "wilaya_code": "29",
    "name": "القطنة"
  },
  {
    "id": 923,
    "wilaya_code": "29",
    "name": "الحشم"
  },
  {
    "id": 924,
    "wilaya_code": "29",
    "name": "القرط"
  },
  {
    "id": 925,
    "wilaya_code": "29",
    "name": "المأمونية"
  },
  {
    "id": 926,
    "wilaya_code": "29",
    "name": "المنور"
  },
  {
    "id": 927,
    "wilaya_code": "29",
    "name": "فراقيق"
  },
  {
    "id": 928,
    "wilaya_code": "29",
    "name": "فروحة"
  },
  {
    "id": 929,
    "wilaya_code": "29",
    "name": "غروس"
  },
  {
    "id": 930,
    "wilaya_code": "29",
    "name": "غريس"
  },
  {
    "id": 931,
    "wilaya_code": "29",
    "name": "قرجوم"
  },
  {
    "id": 932,
    "wilaya_code": "29",
    "name": "حسين"
  },
  {
    "id": 933,
    "wilaya_code": "29",
    "name": "خلوية"
  },
  {
    "id": 934,
    "wilaya_code": "29",
    "name": "ماقضة"
  },
  {
    "id": 935,
    "wilaya_code": "29",
    "name": "ماوسة"
  },
  {
    "id": 936,
    "wilaya_code": "29",
    "name": "معسكر"
  },
  {
    "id": 937,
    "wilaya_code": "29",
    "name": "المطمور"
  },
  {
    "id": 938,
    "wilaya_code": "29",
    "name": "مقطع الدوز"
  },
  {
    "id": 939,
    "wilaya_code": "29",
    "name": "المحمدية"
  },
  {
    "id": 940,
    "wilaya_code": "29",
    "name": "نسمط"
  },
  {
    "id": 941,
    "wilaya_code": "29",
    "name": "عقاز"
  },
  {
    "id": 942,
    "wilaya_code": "29",
    "name": "وادي الأبطال"
  },
  {
    "id": 943,
    "wilaya_code": "29",
    "name": "وادي التاغية"
  },
  {
    "id": 944,
    "wilaya_code": "29",
    "name": "رأس عين عميروش"
  },
  {
    "id": 945,
    "wilaya_code": "29",
    "name": "سجرارة"
  },
  {
    "id": 946,
    "wilaya_code": "29",
    "name": "السهايلية"
  },
  {
    "id": 947,
    "wilaya_code": "29",
    "name": "سيدي عبد الجبار"
  },
  {
    "id": 948,
    "wilaya_code": "29",
    "name": "سيدي عبد المومن"
  },
  {
    "id": 949,
    "wilaya_code": "29",
    "name": "سيدي بوسعيد"
  },
  {
    "id": 950,
    "wilaya_code": "29",
    "name": "سيدي قادة"
  },
  {
    "id": 951,
    "wilaya_code": "29",
    "name": "سيق"
  },
  {
    "id": 952,
    "wilaya_code": "29",
    "name": "تيغنيف"
  },
  {
    "id": 953,
    "wilaya_code": "29",
    "name": "تيزي"
  },
  {
    "id": 954,
    "wilaya_code": "29",
    "name": "زهانة"
  },
  {
    "id": 955,
    "wilaya_code": "29",
    "name": "زلامطة"
  },
  {
    "id": 956,
    "wilaya_code": "30",
    "name": "عين البيضاء"
  },
  {
    "id": 957,
    "wilaya_code": "30",
    "name": "البرمة"
  },
  {
    "id": 958,
    "wilaya_code": "30",
    "name": "حاسي بن عبد الله"
  },
  {
    "id": 959,
    "wilaya_code": "30",
    "name": "حاسي مسعود"
  },
  {
    "id": 960,
    "wilaya_code": "30",
    "name": "انقوسة"
  },
  {
    "id": 961,
    "wilaya_code": "30",
    "name": "ورقلة"
  },
  {
    "id": 962,
    "wilaya_code": "30",
    "name": "الرويسات"
  },
  {
    "id": 963,
    "wilaya_code": "30",
    "name": "سيدي خويلد"
  },
  {
    "id": 964,
    "wilaya_code": "31",
    "name": "عين البية"
  },
  {
    "id": 965,
    "wilaya_code": "31",
    "name": "عين الكرمة"
  },
  {
    "id": 966,
    "wilaya_code": "31",
    "name": "عين الترك"
  },
  {
    "id": 967,
    "wilaya_code": "31",
    "name": "أرزيو"
  },
  {
    "id": 968,
    "wilaya_code": "31",
    "name": "بن فريحة"
  },
  {
    "id": 969,
    "wilaya_code": "31",
    "name": "بطيوة"
  },
  {
    "id": 970,
    "wilaya_code": "31",
    "name": "بئر الجير"
  },
  {
    "id": 971,
    "wilaya_code": "31",
    "name": "بوفاتيس"
  },
  {
    "id": 972,
    "wilaya_code": "31",
    "name": "بوسفر"
  },
  {
    "id": 973,
    "wilaya_code": "31",
    "name": "بوتليليس"
  },
  {
    "id": 974,
    "wilaya_code": "31",
    "name": "العنصر"
  },
  {
    "id": 975,
    "wilaya_code": "31",
    "name": "البراية"
  },
  {
    "id": 976,
    "wilaya_code": "31",
    "name": "الكرمة"
  },
  {
    "id": 977,
    "wilaya_code": "31",
    "name": "السانية"
  },
  {
    "id": 978,
    "wilaya_code": "31",
    "name": "قديل"
  },
  {
    "id": 979,
    "wilaya_code": "31",
    "name": "حاسي بن عقبة"
  },
  {
    "id": 980,
    "wilaya_code": "31",
    "name": "حاسي بونيف"
  },
  {
    "id": 981,
    "wilaya_code": "31",
    "name": "حاسي مفسوخ"
  },
  {
    "id": 982,
    "wilaya_code": "31",
    "name": "مرسى الحجاج"
  },
  {
    "id": 983,
    "wilaya_code": "31",
    "name": "المرسى الكبير"
  },
  {
    "id": 984,
    "wilaya_code": "31",
    "name": "مسرغين"
  },
  {
    "id": 985,
    "wilaya_code": "31",
    "name": "وهران"
  },
  {
    "id": 986,
    "wilaya_code": "31",
    "name": "وادي تليلات"
  },
  {
    "id": 987,
    "wilaya_code": "31",
    "name": "سيدي بن يبقى"
  },
  {
    "id": 988,
    "wilaya_code": "31",
    "name": "سيدي الشحمي"
  },
  {
    "id": 989,
    "wilaya_code": "31",
    "name": "طفراوي"
  },
  {
    "id": 990,
    "wilaya_code": "32",
    "name": "بوعلام"
  },
  {
    "id": 991,
    "wilaya_code": "32",
    "name": "بوقطب"
  },
  {
    "id": 992,
    "wilaya_code": "32",
    "name": "بريزينة"
  },
  {
    "id": 993,
    "wilaya_code": "32",
    "name": "الشقيق"
  },
  {
    "id": 994,
    "wilaya_code": "32",
    "name": "البيض"
  },
  {
    "id": 995,
    "wilaya_code": "32",
    "name": "الخيثر"
  },
  {
    "id": 996,
    "wilaya_code": "32",
    "name": "الغاسول"
  },
  {
    "id": 997,
    "wilaya_code": "32",
    "name": "الكاف الأحمر"
  },
  {
    "id": 998,
    "wilaya_code": "32",
    "name": "كراكدة"
  },
  {
    "id": 999,
    "wilaya_code": "32",
    "name": "رقاصة"
  },
  {
    "id": 1000,
    "wilaya_code": "32",
    "name": "سيدي عامر"
  },
  {
    "id": 1001,
    "wilaya_code": "32",
    "name": "سيدي سليمان"
  },
  {
    "id": 1002,
    "wilaya_code": "32",
    "name": "سيدي طيفور"
  },
  {
    "id": 1003,
    "wilaya_code": "32",
    "name": "ستيتن"
  },
  {
    "id": 1004,
    "wilaya_code": "32",
    "name": "توسمولين"
  },
  {
    "id": 1005,
    "wilaya_code": "33",
    "name": "برج عمر إدريس"
  },
  {
    "id": 1006,
    "wilaya_code": "33",
    "name": "دبداب"
  },
  {
    "id": 1007,
    "wilaya_code": "33",
    "name": "إيليزي"
  },
  {
    "id": 1008,
    "wilaya_code": "33",
    "name": "إن أمناس"
  },
  {
    "id": 1009,
    "wilaya_code": "34",
    "name": "عين تاغروت"
  },
  {
    "id": 1010,
    "wilaya_code": "34",
    "name": "عين تسرة"
  },
  {
    "id": 1011,
    "wilaya_code": "34",
    "name": "بليمور"
  },
  {
    "id": 1012,
    "wilaya_code": "34",
    "name": "بن داود"
  },
  {
    "id": 1013,
    "wilaya_code": "34",
    "name": "بئر قاصد علي"
  },
  {
    "id": 1014,
    "wilaya_code": "34",
    "name": "برج بوعريرج"
  },
  {
    "id": 1015,
    "wilaya_code": "34",
    "name": "برج الغدير"
  },
  {
    "id": 1016,
    "wilaya_code": "34",
    "name": "برج زمورة"
  },
  {
    "id": 1017,
    "wilaya_code": "34",
    "name": "القلة"
  },
  {
    "id": 1018,
    "wilaya_code": "34",
    "name": "جعافرة"
  },
  {
    "id": 1019,
    "wilaya_code": "34",
    "name": "الياشير"
  },
  {
    "id": 1020,
    "wilaya_code": "34",
    "name": "العناصر"
  },
  {
    "id": 1021,
    "wilaya_code": "34",
    "name": "العش"
  },
  {
    "id": 1022,
    "wilaya_code": "34",
    "name": "المهير"
  },
  {
    "id": 1023,
    "wilaya_code": "34",
    "name": "الماين"
  },
  {
    "id": 1024,
    "wilaya_code": "34",
    "name": "الحمادية"
  },
  {
    "id": 1025,
    "wilaya_code": "34",
    "name": "غيلاسة"
  },
  {
    "id": 1026,
    "wilaya_code": "34",
    "name": "حرازة"
  },
  {
    "id": 1027,
    "wilaya_code": "34",
    "name": "حسناوة"
  },
  {
    "id": 1028,
    "wilaya_code": "34",
    "name": "خليل"
  },
  {
    "id": 1029,
    "wilaya_code": "34",
    "name": "القصور"
  },
  {
    "id": 1030,
    "wilaya_code": "34",
    "name": "المنصورة"
  },
  {
    "id": 1031,
    "wilaya_code": "34",
    "name": "مجانة"
  },
  {
    "id": 1032,
    "wilaya_code": "34",
    "name": "أولاد أبراهم"
  },
  {
    "id": 1033,
    "wilaya_code": "34",
    "name": "أولاد دحمان"
  },
  {
    "id": 1034,
    "wilaya_code": "34",
    "name": "أولاد سيدي ابراهيم"
  },
  {
    "id": 1035,
    "wilaya_code": "34",
    "name": "الرابطة"
  },
  {
    "id": 1036,
    "wilaya_code": "34",
    "name": "رأس الوادي"
  },
  {
    "id": 1037,
    "wilaya_code": "34",
    "name": "سيدي أمبارك"
  },
  {
    "id": 1038,
    "wilaya_code": "34",
    "name": "تقلعيت"
  },
  {
    "id": 1039,
    "wilaya_code": "34",
    "name": "تسامرت"
  },
  {
    "id": 1040,
    "wilaya_code": "34",
    "name": "تفرق"
  },
  {
    "id": 1041,
    "wilaya_code": "34",
    "name": "ثنية النصر"
  },
  {
    "id": 1042,
    "wilaya_code": "34",
    "name": "تيكستار"
  },
  {
    "id": 1043,
    "wilaya_code": "35",
    "name": "أعفير"
  },
  {
    "id": 1044,
    "wilaya_code": "35",
    "name": "عمال"
  },
  {
    "id": 1045,
    "wilaya_code": "35",
    "name": "بغلية"
  },
  {
    "id": 1046,
    "wilaya_code": "35",
    "name": "بن شود"
  },
  {
    "id": 1047,
    "wilaya_code": "35",
    "name": "بني عمران"
  },
  {
    "id": 1048,
    "wilaya_code": "35",
    "name": "برج منايل"
  },
  {
    "id": 1049,
    "wilaya_code": "35",
    "name": "بودواو"
  },
  {
    "id": 1050,
    "wilaya_code": "35",
    "name": "بودواو البحري"
  },
  {
    "id": 1051,
    "wilaya_code": "35",
    "name": "بومرداس"
  },
  {
    "id": 1052,
    "wilaya_code": "35",
    "name": "بوزقزة قدارة"
  },
  {
    "id": 1053,
    "wilaya_code": "35",
    "name": "شعبة العامر"
  },
  {
    "id": 1054,
    "wilaya_code": "35",
    "name": "قورصو"
  },
  {
    "id": 1055,
    "wilaya_code": "35",
    "name": "دلس"
  },
  {
    "id": 1056,
    "wilaya_code": "35",
    "name": "جنات"
  },
  {
    "id": 1057,
    "wilaya_code": "35",
    "name": "الخروبة"
  },
  {
    "id": 1058,
    "wilaya_code": "35",
    "name": "حمادي"
  },
  {
    "id": 1059,
    "wilaya_code": "35",
    "name": "يسر"
  },
  {
    "id": 1060,
    "wilaya_code": "35",
    "name": "خميس الخشنة"
  },
  {
    "id": 1061,
    "wilaya_code": "35",
    "name": "الاربعطاش"
  },
  {
    "id": 1062,
    "wilaya_code": "35",
    "name": "لقاطة"
  },
  {
    "id": 1063,
    "wilaya_code": "35",
    "name": "الناصرية"
  },
  {
    "id": 1064,
    "wilaya_code": "35",
    "name": "أولاد عيسى"
  },
  {
    "id": 1065,
    "wilaya_code": "35",
    "name": "أولاد هداج"
  },
  {
    "id": 1066,
    "wilaya_code": "35",
    "name": "أولاد موسى"
  },
  {
    "id": 1067,
    "wilaya_code": "35",
    "name": "سي مصطفى"
  },
  {
    "id": 1068,
    "wilaya_code": "35",
    "name": "سيدي داود"
  },
  {
    "id": 1069,
    "wilaya_code": "35",
    "name": "سوق الحد"
  },
  {
    "id": 1070,
    "wilaya_code": "35",
    "name": "تاورقة"
  },
  {
    "id": 1071,
    "wilaya_code": "35",
    "name": "الثنية"
  },
  {
    "id": 1072,
    "wilaya_code": "35",
    "name": "تيجلابين"
  },
  {
    "id": 1073,
    "wilaya_code": "35",
    "name": "تيمزريت"
  },
  {
    "id": 1074,
    "wilaya_code": "35",
    "name": "زموري"
  },
  {
    "id": 1075,
    "wilaya_code": "36",
    "name": "عين العسل"
  },
  {
    "id": 1076,
    "wilaya_code": "36",
    "name": "عين الكرمة"
  },
  {
    "id": 1077,
    "wilaya_code": "36",
    "name": "عصفور"
  },
  {
    "id": 1078,
    "wilaya_code": "36",
    "name": "بن مهيدي"
  },
  {
    "id": 1079,
    "wilaya_code": "36",
    "name": "بريحان"
  },
  {
    "id": 1080,
    "wilaya_code": "36",
    "name": "البسباس"
  },
  {
    "id": 1081,
    "wilaya_code": "36",
    "name": "بوقوس"
  },
  {
    "id": 1082,
    "wilaya_code": "36",
    "name": "بوحجار"
  },
  {
    "id": 1083,
    "wilaya_code": "36",
    "name": "بوثلجة"
  },
  {
    "id": 1084,
    "wilaya_code": "36",
    "name": "شبيطة مختار"
  },
  {
    "id": 1085,
    "wilaya_code": "36",
    "name": "الشافية"
  },
  {
    "id": 1086,
    "wilaya_code": "36",
    "name": "شحاني"
  },
  {
    "id": 1087,
    "wilaya_code": "36",
    "name": "الذرعـان"
  },
  {
    "id": 1088,
    "wilaya_code": "36",
    "name": "الشط"
  },
  {
    "id": 1089,
    "wilaya_code": "36",
    "name": "العيون"
  },
  {
    "id": 1090,
    "wilaya_code": "36",
    "name": "القالة"
  },
  {
    "id": 1091,
    "wilaya_code": "36",
    "name": "الطارف"
  },
  {
    "id": 1092,
    "wilaya_code": "36",
    "name": "حمام بني صالح"
  },
  {
    "id": 1093,
    "wilaya_code": "36",
    "name": "بحيرة الطيور"
  },
  {
    "id": 1094,
    "wilaya_code": "36",
    "name": "وادي الزيتون"
  },
  {
    "id": 1095,
    "wilaya_code": "36",
    "name": "رمل السوق"
  },
  {
    "id": 1096,
    "wilaya_code": "36",
    "name": "السوارخ"
  },
  {
    "id": 1097,
    "wilaya_code": "36",
    "name": "زريزر"
  },
  {
    "id": 1098,
    "wilaya_code": "36",
    "name": "الزيتونة"
  },
  {
    "id": 1099,
    "wilaya_code": "37",
    "name": "أم العسل"
  },
  {
    "id": 1100,
    "wilaya_code": "37",
    "name": "تندوف"
  },
  {
    "id": 1101,
    "wilaya_code": "38",
    "name": "عماري"
  },
  {
    "id": 1102,
    "wilaya_code": "38",
    "name": "بني شعيب"
  },
  {
    "id": 1103,
    "wilaya_code": "38",
    "name": "بني لحسن"
  },
  {
    "id": 1104,
    "wilaya_code": "38",
    "name": "برج بونعامة"
  },
  {
    "id": 1105,
    "wilaya_code": "38",
    "name": "برج الأمير عبد القادر"
  },
  {
    "id": 1106,
    "wilaya_code": "38",
    "name": "بوقائد"
  },
  {
    "id": 1107,
    "wilaya_code": "38",
    "name": "خميستي"
  },
  {
    "id": 1108,
    "wilaya_code": "38",
    "name": "الأربعاء"
  },
  {
    "id": 1109,
    "wilaya_code": "38",
    "name": "لرجام"
  },
  {
    "id": 1110,
    "wilaya_code": "38",
    "name": "العيون"
  },
  {
    "id": 1111,
    "wilaya_code": "38",
    "name": "الأزهرية"
  },
  {
    "id": 1112,
    "wilaya_code": "38",
    "name": "المعاصم"
  },
  {
    "id": 1113,
    "wilaya_code": "38",
    "name": "الملعب"
  },
  {
    "id": 1114,
    "wilaya_code": "38",
    "name": "أولاد بسام"
  },
  {
    "id": 1115,
    "wilaya_code": "38",
    "name": "سيدي عابد"
  },
  {
    "id": 1116,
    "wilaya_code": "38",
    "name": "سيدي بوتوشنت"
  },
  {
    "id": 1117,
    "wilaya_code": "38",
    "name": "سيدي العنتري"
  },
  {
    "id": 1118,
    "wilaya_code": "38",
    "name": "سيدي سليمان"
  },
  {
    "id": 1119,
    "wilaya_code": "38",
    "name": "تملاحت"
  },
  {
    "id": 1120,
    "wilaya_code": "38",
    "name": "ثنية الاحد"
  },
  {
    "id": 1121,
    "wilaya_code": "38",
    "name": "تيسمسيلت"
  },
  {
    "id": 1122,
    "wilaya_code": "38",
    "name": "اليوسفية"
  },
  {
    "id": 1123,
    "wilaya_code": "39",
    "name": "البياضة"
  },
  {
    "id": 1124,
    "wilaya_code": "39",
    "name": "بن قشة"
  },
  {
    "id": 1125,
    "wilaya_code": "39",
    "name": "الدبيلة"
  },
  {
    "id": 1126,
    "wilaya_code": "39",
    "name": "دوار الماء"
  },
  {
    "id": 1127,
    "wilaya_code": "39",
    "name": "العقلة"
  },
  {
    "id": 1128,
    "wilaya_code": "39",
    "name": "الوادي"
  },
  {
    "id": 1129,
    "wilaya_code": "39",
    "name": "قمار"
  },
  {
    "id": 1130,
    "wilaya_code": "39",
    "name": "الحمراية"
  },
  {
    "id": 1131,
    "wilaya_code": "39",
    "name": "حساني عبد الكريم"
  },
  {
    "id": 1132,
    "wilaya_code": "39",
    "name": "حاسي خليفة"
  },
  {
    "id": 1133,
    "wilaya_code": "39",
    "name": "كوينين"
  },
  {
    "id": 1134,
    "wilaya_code": "39",
    "name": "المقرن"
  },
  {
    "id": 1135,
    "wilaya_code": "39",
    "name": "اميه وانسة"
  },
  {
    "id": 1136,
    "wilaya_code": "39",
    "name": "النخلة"
  },
  {
    "id": 1137,
    "wilaya_code": "39",
    "name": "وادي العلندة"
  },
  {
    "id": 1138,
    "wilaya_code": "39",
    "name": "ورماس"
  },
  {
    "id": 1139,
    "wilaya_code": "39",
    "name": "الرقيبة"
  },
  {
    "id": 1140,
    "wilaya_code": "39",
    "name": "الرباح"
  },
  {
    "id": 1141,
    "wilaya_code": "39",
    "name": "سيدي عون"
  },
  {
    "id": 1142,
    "wilaya_code": "39",
    "name": "تغزوت"
  },
  {
    "id": 1143,
    "wilaya_code": "39",
    "name": "الطالب العربي"
  },
  {
    "id": 1144,
    "wilaya_code": "39",
    "name": "الطريفاوي"
  },
  {
    "id": 1145,
    "wilaya_code": "40",
    "name": "عين الطويلة"
  },
  {
    "id": 1146,
    "wilaya_code": "40",
    "name": "بابار"
  },
  {
    "id": 1147,
    "wilaya_code": "40",
    "name": "بغاي"
  },
  {
    "id": 1148,
    "wilaya_code": "40",
    "name": "بوحمامة"
  },
  {
    "id": 1149,
    "wilaya_code": "40",
    "name": "ششار"
  },
  {
    "id": 1150,
    "wilaya_code": "40",
    "name": "شلية"
  },
  {
    "id": 1151,
    "wilaya_code": "40",
    "name": "جلال"
  },
  {
    "id": 1152,
    "wilaya_code": "40",
    "name": "الحامة"
  },
  {
    "id": 1153,
    "wilaya_code": "40",
    "name": "المحمل"
  },
  {
    "id": 1154,
    "wilaya_code": "40",
    "name": "الولجة"
  },
  {
    "id": 1155,
    "wilaya_code": "40",
    "name": "انسيغة"
  },
  {
    "id": 1156,
    "wilaya_code": "40",
    "name": "قايس"
  },
  {
    "id": 1157,
    "wilaya_code": "40",
    "name": "خنشلة"
  },
  {
    "id": 1158,
    "wilaya_code": "40",
    "name": "خيران"
  },
  {
    "id": 1159,
    "wilaya_code": "40",
    "name": "مصارة"
  },
  {
    "id": 1160,
    "wilaya_code": "40",
    "name": "متوسة"
  },
  {
    "id": 1161,
    "wilaya_code": "40",
    "name": "أولاد رشاش"
  },
  {
    "id": 1162,
    "wilaya_code": "40",
    "name": "الرميلة"
  },
  {
    "id": 1163,
    "wilaya_code": "40",
    "name": "طامزة"
  },
  {
    "id": 1164,
    "wilaya_code": "40",
    "name": "تاوزيانت"
  },
  {
    "id": 1165,
    "wilaya_code": "40",
    "name": "يابوس"
  },
  {
    "id": 1166,
    "wilaya_code": "41",
    "name": "عين سلطان"
  },
  {
    "id": 1167,
    "wilaya_code": "41",
    "name": "عين الزانة"
  },
  {
    "id": 1168,
    "wilaya_code": "41",
    "name": "بئر بوحوش"
  },
  {
    "id": 1169,
    "wilaya_code": "41",
    "name": "الدريعة"
  },
  {
    "id": 1170,
    "wilaya_code": "41",
    "name": "الحدادة"
  },
  {
    "id": 1171,
    "wilaya_code": "41",
    "name": "الحنانشة"
  },
  {
    "id": 1172,
    "wilaya_code": "41",
    "name": "الخضارة"
  },
  {
    "id": 1173,
    "wilaya_code": "41",
    "name": "خميسة"
  },
  {
    "id": 1174,
    "wilaya_code": "41",
    "name": "مداوروش"
  },
  {
    "id": 1175,
    "wilaya_code": "41",
    "name": "المشروحة"
  },
  {
    "id": 1176,
    "wilaya_code": "41",
    "name": "المراهنة"
  },
  {
    "id": 1177,
    "wilaya_code": "41",
    "name": "وادي الكبريت"
  },
  {
    "id": 1178,
    "wilaya_code": "41",
    "name": "ويلان"
  },
  {
    "id": 1179,
    "wilaya_code": "41",
    "name": "أولاد إدريس"
  },
  {
    "id": 1180,
    "wilaya_code": "41",
    "name": "أولاد مومن"
  },
  {
    "id": 1181,
    "wilaya_code": "41",
    "name": "أم العظايم"
  },
  {
    "id": 1182,
    "wilaya_code": "41",
    "name": "الراقوبة"
  },
  {
    "id": 1183,
    "wilaya_code": "41",
    "name": "سافل الويدان"
  },
  {
    "id": 1184,
    "wilaya_code": "41",
    "name": "سدراتة"
  },
  {
    "id": 1185,
    "wilaya_code": "41",
    "name": "سيدي فرج"
  },
  {
    "id": 1186,
    "wilaya_code": "41",
    "name": "سوق أهراس"
  },
  {
    "id": 1187,
    "wilaya_code": "41",
    "name": "تاورة"
  },
  {
    "id": 1188,
    "wilaya_code": "41",
    "name": "ترقالت"
  },
  {
    "id": 1189,
    "wilaya_code": "41",
    "name": "تيفاش"
  },
  {
    "id": 1190,
    "wilaya_code": "41",
    "name": "الزعرورية"
  },
  {
    "id": 1191,
    "wilaya_code": "41",
    "name": "الزوابي"
  },
  {
    "id": 1192,
    "wilaya_code": "42",
    "name": "أغبال"
  },
  {
    "id": 1193,
    "wilaya_code": "42",
    "name": "أحمر العين"
  },
  {
    "id": 1194,
    "wilaya_code": "42",
    "name": "عين تاقورايت"
  },
  {
    "id": 1195,
    "wilaya_code": "42",
    "name": "الحطاطبة"
  },
  {
    "id": 1196,
    "wilaya_code": "42",
    "name": "بني ميلك"
  },
  {
    "id": 1197,
    "wilaya_code": "42",
    "name": "بوهارون"
  },
  {
    "id": 1198,
    "wilaya_code": "42",
    "name": "بواسماعيل"
  },
  {
    "id": 1199,
    "wilaya_code": "42",
    "name": "بورقيقة"
  },
  {
    "id": 1200,
    "wilaya_code": "42",
    "name": "الشعيبة"
  },
  {
    "id": 1201,
    "wilaya_code": "42",
    "name": "شرشال"
  },
  {
    "id": 1202,
    "wilaya_code": "42",
    "name": "الداموس"
  },
  {
    "id": 1203,
    "wilaya_code": "42",
    "name": "دواودة"
  },
  {
    "id": 1204,
    "wilaya_code": "42",
    "name": "فوكة"
  },
  {
    "id": 1205,
    "wilaya_code": "42",
    "name": "قوراية"
  },
  {
    "id": 1206,
    "wilaya_code": "42",
    "name": "حجوط"
  },
  {
    "id": 1207,
    "wilaya_code": "42",
    "name": "حجرة النص"
  },
  {
    "id": 1208,
    "wilaya_code": "42",
    "name": "خميستي"
  },
  {
    "id": 1209,
    "wilaya_code": "42",
    "name": "القليعة"
  },
  {
    "id": 1210,
    "wilaya_code": "42",
    "name": "الأرهاط"
  },
  {
    "id": 1211,
    "wilaya_code": "42",
    "name": "مناصر"
  },
  {
    "id": 1212,
    "wilaya_code": "42",
    "name": "مراد"
  },
  {
    "id": 1213,
    "wilaya_code": "42",
    "name": "مسلمون"
  },
  {
    "id": 1214,
    "wilaya_code": "42",
    "name": "الناظور"
  },
  {
    "id": 1215,
    "wilaya_code": "42",
    "name": "سيدي غيلاس"
  },
  {
    "id": 1216,
    "wilaya_code": "42",
    "name": "سيدي راشد"
  },
  {
    "id": 1217,
    "wilaya_code": "42",
    "name": "سيدي سميان"
  },
  {
    "id": 1218,
    "wilaya_code": "42",
    "name": "سيدي عامر"
  },
  {
    "id": 1219,
    "wilaya_code": "42",
    "name": "تيبازة"
  },
  {
    "id": 1220,
    "wilaya_code": "43",
    "name": "أحمد راشدي"
  },
  {
    "id": 1221,
    "wilaya_code": "43",
    "name": "عين البيضاء أحريش"
  },
  {
    "id": 1222,
    "wilaya_code": "43",
    "name": "عين الملوك"
  },
  {
    "id": 1223,
    "wilaya_code": "43",
    "name": "عين التين"
  },
  {
    "id": 1224,
    "wilaya_code": "43",
    "name": "اعميرة اراس"
  },
  {
    "id": 1225,
    "wilaya_code": "43",
    "name": "بن يحي عبد الرحمن"
  },
  {
    "id": 1226,
    "wilaya_code": "43",
    "name": "بوحاتم"
  },
  {
    "id": 1227,
    "wilaya_code": "43",
    "name": "شلغوم العيد"
  },
  {
    "id": 1228,
    "wilaya_code": "43",
    "name": "الشيقارة"
  },
  {
    "id": 1229,
    "wilaya_code": "43",
    "name": "دراحي بوصلاح"
  },
  {
    "id": 1230,
    "wilaya_code": "43",
    "name": "العياضي برباس"
  },
  {
    "id": 1231,
    "wilaya_code": "43",
    "name": "مشيرة"
  },
  {
    "id": 1232,
    "wilaya_code": "43",
    "name": "فرجيوة"
  },
  {
    "id": 1233,
    "wilaya_code": "43",
    "name": "القرارم قوقة"
  },
  {
    "id": 1234,
    "wilaya_code": "43",
    "name": "حمالة"
  },
  {
    "id": 1235,
    "wilaya_code": "43",
    "name": "ميلة"
  },
  {
    "id": 1236,
    "wilaya_code": "43",
    "name": "مينار زارزة"
  },
  {
    "id": 1237,
    "wilaya_code": "43",
    "name": "وادي العثمانية"
  },
  {
    "id": 1238,
    "wilaya_code": "43",
    "name": "وادي النجاء"
  },
  {
    "id": 1239,
    "wilaya_code": "43",
    "name": "وادي سقان"
  },
  {
    "id": 1240,
    "wilaya_code": "43",
    "name": "أولاد اخلوف"
  },
  {
    "id": 1241,
    "wilaya_code": "43",
    "name": "الرواشد"
  },
  {
    "id": 1242,
    "wilaya_code": "43",
    "name": "سيدي خليفة"
  },
  {
    "id": 1243,
    "wilaya_code": "43",
    "name": "سيدي مروان"
  },
  {
    "id": 1244,
    "wilaya_code": "43",
    "name": "تاجنانت"
  },
  {
    "id": 1245,
    "wilaya_code": "43",
    "name": "تسدان حدادة"
  },
  {
    "id": 1246,
    "wilaya_code": "43",
    "name": "تسالة لمطاعي"
  },
  {
    "id": 1247,
    "wilaya_code": "43",
    "name": "التلاغمة"
  },
  {
    "id": 1248,
    "wilaya_code": "43",
    "name": "ترعي باينان"
  },
  {
    "id": 1249,
    "wilaya_code": "43",
    "name": "تيبرقنت"
  },
  {
    "id": 1250,
    "wilaya_code": "43",
    "name": "يحي بني قشة"
  },
  {
    "id": 1251,
    "wilaya_code": "43",
    "name": "زغاية"
  },
  {
    "id": 1252,
    "wilaya_code": "44",
    "name": "عين البنيان"
  },
  {
    "id": 1253,
    "wilaya_code": "44",
    "name": "عين بويحيى"
  },
  {
    "id": 1254,
    "wilaya_code": "44",
    "name": "عين الدفلى"
  },
  {
    "id": 1255,
    "wilaya_code": "44",
    "name": "عين الاشياخ"
  },
  {
    "id": 1256,
    "wilaya_code": "44",
    "name": "عين السلطان"
  },
  {
    "id": 1257,
    "wilaya_code": "44",
    "name": "عين التركي"
  },
  {
    "id": 1258,
    "wilaya_code": "44",
    "name": "عريب"
  },
  {
    "id": 1259,
    "wilaya_code": "44",
    "name": "بطحية"
  },
  {
    "id": 1260,
    "wilaya_code": "44",
    "name": "بلعاص"
  },
  {
    "id": 1261,
    "wilaya_code": "44",
    "name": "بن علال"
  },
  {
    "id": 1262,
    "wilaya_code": "44",
    "name": "بئر ولد خليفة"
  },
  {
    "id": 1263,
    "wilaya_code": "44",
    "name": "بربوش"
  },
  {
    "id": 1264,
    "wilaya_code": "44",
    "name": "برج الأمير خالد"
  },
  {
    "id": 1265,
    "wilaya_code": "44",
    "name": "بومدفع"
  },
  {
    "id": 1266,
    "wilaya_code": "44",
    "name": "بوراشد"
  },
  {
    "id": 1267,
    "wilaya_code": "44",
    "name": "جليدة"
  },
  {
    "id": 1268,
    "wilaya_code": "44",
    "name": "جمعة أولاد الشيخ"
  },
  {
    "id": 1269,
    "wilaya_code": "44",
    "name": "جندل"
  },
  {
    "id": 1270,
    "wilaya_code": "44",
    "name": "العبادية"
  },
  {
    "id": 1271,
    "wilaya_code": "44",
    "name": "العامرة"
  },
  {
    "id": 1272,
    "wilaya_code": "44",
    "name": "العطاف"
  },
  {
    "id": 1273,
    "wilaya_code": "44",
    "name": "الماين"
  },
  {
    "id": 1274,
    "wilaya_code": "44",
    "name": "حمام ريغة"
  },
  {
    "id": 1275,
    "wilaya_code": "44",
    "name": "الحسانية"
  },
  {
    "id": 1276,
    "wilaya_code": "44",
    "name": "الحسينية"
  },
  {
    "id": 1277,
    "wilaya_code": "44",
    "name": "خميس مليانة"
  },
  {
    "id": 1278,
    "wilaya_code": "44",
    "name": "المخاطرية"
  },
  {
    "id": 1279,
    "wilaya_code": "44",
    "name": "مليانة"
  },
  {
    "id": 1280,
    "wilaya_code": "44",
    "name": "وادي الشرفاء"
  },
  {
    "id": 1281,
    "wilaya_code": "44",
    "name": "واد الجمعة"
  },
  {
    "id": 1282,
    "wilaya_code": "44",
    "name": "الروينة"
  },
  {
    "id": 1283,
    "wilaya_code": "44",
    "name": "سيدي الأخضر"
  },
  {
    "id": 1284,
    "wilaya_code": "44",
    "name": "تاشتة زقاغة"
  },
  {
    "id": 1285,
    "wilaya_code": "44",
    "name": "طارق بن زياد"
  },
  {
    "id": 1286,
    "wilaya_code": "44",
    "name": "تبركانين"
  },
  {
    "id": 1287,
    "wilaya_code": "44",
    "name": "زدين"
  },
  {
    "id": 1288,
    "wilaya_code": "45",
    "name": "عين بن خليل"
  },
  {
    "id": 1289,
    "wilaya_code": "45",
    "name": "عين الصفراء"
  },
  {
    "id": 1290,
    "wilaya_code": "45",
    "name": "عسلة"
  },
  {
    "id": 1291,
    "wilaya_code": "45",
    "name": "جنين بورزق"
  },
  {
    "id": 1292,
    "wilaya_code": "45",
    "name": "البيوض"
  },
  {
    "id": 1293,
    "wilaya_code": "45",
    "name": "القصدير"
  },
  {
    "id": 1294,
    "wilaya_code": "45",
    "name": "مكمن بن عمار"
  },
  {
    "id": 1295,
    "wilaya_code": "45",
    "name": "المشرية"
  },
  {
    "id": 1296,
    "wilaya_code": "45",
    "name": "مغرار"
  },
  {
    "id": 1297,
    "wilaya_code": "45",
    "name": "النعامة"
  },
  {
    "id": 1298,
    "wilaya_code": "45",
    "name": "سفيسيفة"
  },
  {
    "id": 1299,
    "wilaya_code": "45",
    "name": "تيوت"
  },
  {
    "id": 1300,
    "wilaya_code": "46",
    "name": "أغلال"
  },
  {
    "id": 1301,
    "wilaya_code": "46",
    "name": "عين الأربعاء"
  },
  {
    "id": 1302,
    "wilaya_code": "46",
    "name": "عين الكيحل"
  },
  {
    "id": 1303,
    "wilaya_code": "46",
    "name": "عين تموشنت"
  },
  {
    "id": 1304,
    "wilaya_code": "46",
    "name": "عين الطلبة"
  },
  {
    "id": 1305,
    "wilaya_code": "46",
    "name": "عقب الليل"
  },
  {
    "id": 1306,
    "wilaya_code": "46",
    "name": "بني صاف"
  },
  {
    "id": 1307,
    "wilaya_code": "46",
    "name": "بوزجار"
  },
  {
    "id": 1308,
    "wilaya_code": "46",
    "name": "شعبة اللحم"
  },
  {
    "id": 1309,
    "wilaya_code": "46",
    "name": "شنتوف"
  },
  {
    "id": 1310,
    "wilaya_code": "46",
    "name": "العامرية"
  },
  {
    "id": 1311,
    "wilaya_code": "46",
    "name": "المالح"
  },
  {
    "id": 1312,
    "wilaya_code": "46",
    "name": "المساعيد"
  },
  {
    "id": 1313,
    "wilaya_code": "46",
    "name": "الأمير عبد القادر"
  },
  {
    "id": 1314,
    "wilaya_code": "46",
    "name": "حمام بوحجر"
  },
  {
    "id": 1315,
    "wilaya_code": "46",
    "name": "الحساسنة"
  },
  {
    "id": 1316,
    "wilaya_code": "46",
    "name": "حاسي الغلة"
  },
  {
    "id": 1317,
    "wilaya_code": "46",
    "name": "وادي برقش"
  },
  {
    "id": 1318,
    "wilaya_code": "46",
    "name": "وادي الصباح"
  },
  {
    "id": 1319,
    "wilaya_code": "46",
    "name": "أولاد بوجمعة"
  },
  {
    "id": 1320,
    "wilaya_code": "46",
    "name": "أولاد الكيحل"
  },
  {
    "id": 1321,
    "wilaya_code": "46",
    "name": "ولهاصة الغرابة"
  },
  {
    "id": 1322,
    "wilaya_code": "46",
    "name": "سيدي بن عدة"
  },
  {
    "id": 1323,
    "wilaya_code": "46",
    "name": "سيدي بومدين"
  },
  {
    "id": 1324,
    "wilaya_code": "46",
    "name": "سيدي ورياش"
  },
  {
    "id": 1325,
    "wilaya_code": "46",
    "name": "سيدي صافي"
  },
  {
    "id": 1326,
    "wilaya_code": "46",
    "name": "تامزورة"
  },
  {
    "id": 1327,
    "wilaya_code": "46",
    "name": "تارقة"
  },
  {
    "id": 1328,
    "wilaya_code": "47",
    "name": "بريان"
  },
  {
    "id": 1329,
    "wilaya_code": "47",
    "name": "بونورة"
  },
  {
    "id": 1330,
    "wilaya_code": "47",
    "name": "ضاية بن ضحوة"
  },
  {
    "id": 1331,
    "wilaya_code": "47",
    "name": "العطف"
  },
  {
    "id": 1332,
    "wilaya_code": "47",
    "name": "القرارة"
  },
  {
    "id": 1333,
    "wilaya_code": "47",
    "name": "غرداية"
  },
  {
    "id": 1334,
    "wilaya_code": "47",
    "name": "المنصورة"
  },
  {
    "id": 1335,
    "wilaya_code": "47",
    "name": "متليلي"
  },
  {
    "id": 1336,
    "wilaya_code": "47",
    "name": "سبسب"
  },
  {
    "id": 1337,
    "wilaya_code": "47",
    "name": "زلفانة"
  },
  {
    "id": 1338,
    "wilaya_code": "48",
    "name": "عين الرحمة"
  },
  {
    "id": 1339,
    "wilaya_code": "48",
    "name": "عين طارق"
  },
  {
    "id": 1340,
    "wilaya_code": "48",
    "name": "عمي موسى"
  },
  {
    "id": 1341,
    "wilaya_code": "48",
    "name": "بلعسل بوزقزة"
  },
  {
    "id": 1342,
    "wilaya_code": "48",
    "name": "بن داود"
  },
  {
    "id": 1343,
    "wilaya_code": "48",
    "name": "بني درقن"
  },
  {
    "id": 1344,
    "wilaya_code": "48",
    "name": "بني زنطيس"
  },
  {
    "id": 1345,
    "wilaya_code": "48",
    "name": "دار بن عبد الله"
  },
  {
    "id": 1346,
    "wilaya_code": "48",
    "name": "جديوية"
  },
  {
    "id": 1347,
    "wilaya_code": "48",
    "name": "الحمادنة"
  },
  {
    "id": 1348,
    "wilaya_code": "48",
    "name": "الحاسي"
  },
  {
    "id": 1349,
    "wilaya_code": "48",
    "name": "الولجة"
  },
  {
    "id": 1350,
    "wilaya_code": "48",
    "name": "القطار"
  },
  {
    "id": 1351,
    "wilaya_code": "48",
    "name": "المطمر"
  },
  {
    "id": 1352,
    "wilaya_code": "48",
    "name": "حد الشكالة"
  },
  {
    "id": 1353,
    "wilaya_code": "48",
    "name": "حمري"
  },
  {
    "id": 1354,
    "wilaya_code": "48",
    "name": "القلعة"
  },
  {
    "id": 1355,
    "wilaya_code": "48",
    "name": "لحلاف"
  },
  {
    "id": 1356,
    "wilaya_code": "48",
    "name": "مازونة"
  },
  {
    "id": 1357,
    "wilaya_code": "48",
    "name": "مديونة"
  },
  {
    "id": 1358,
    "wilaya_code": "48",
    "name": "منداس"
  },
  {
    "id": 1359,
    "wilaya_code": "48",
    "name": "مرجة سيدي عابد"
  },
  {
    "id": 1360,
    "wilaya_code": "48",
    "name": "واريزان"
  },
  {
    "id": 1361,
    "wilaya_code": "48",
    "name": "وادي الجمعة"
  },
  {
    "id": 1362,
    "wilaya_code": "48",
    "name": "وادي السلام"
  },
  {
    "id": 1363,
    "wilaya_code": "48",
    "name": "وادي رهيو"
  },
  {
    "id": 1364,
    "wilaya_code": "48",
    "name": "أولاد يعيش"
  },
  {
    "id": 1365,
    "wilaya_code": "48",
    "name": "أولاد سيدي الميهوب"
  },
  {
    "id": 1366,
    "wilaya_code": "48",
    "name": "الرمكة"
  },
  {
    "id": 1367,
    "wilaya_code": "48",
    "name": "غليزان"
  },
  {
    "id": 1368,
    "wilaya_code": "48",
    "name": "سيدي خطاب"
  },
  {
    "id": 1369,
    "wilaya_code": "48",
    "name": "سيدي لزرق"
  },
  {
    "id": 1370,
    "wilaya_code": "48",
    "name": "سيدي أمحمد بن علي"
  },
  {
    "id": 1371,
    "wilaya_code": "48",
    "name": "سيدي امحمد بن عودة"
  },
  {
    "id": 1372,
    "wilaya_code": "48",
    "name": "سيدي سعادة"
  },
  {
    "id": 1373,
    "wilaya_code": "48",
    "name": "سوق الحد"
  },
  {
    "id": 1374,
    "wilaya_code": "48",
    "name": "يلل"
  },
  {
    "id": 1375,
    "wilaya_code": "48",
    "name": "زمورة"
  },
  {
    "id": 1376,
    "wilaya_code": "49",
    "name": "أوقروت"
  },
  {
    "id": 1377,
    "wilaya_code": "49",
    "name": "شروين"
  },
  {
    "id": 1378,
    "wilaya_code": "49",
    "name": "دلدول"
  },
  {
    "id": 1379,
    "wilaya_code": "49",
    "name": "قصر قدور"
  },
  {
    "id": 1380,
    "wilaya_code": "49",
    "name": "المطارفة"
  },
  {
    "id": 1381,
    "wilaya_code": "49",
    "name": "أولاد عيسى"
  },
  {
    "id": 1382,
    "wilaya_code": "49",
    "name": "أولاد السعيد"
  },
  {
    "id": 1383,
    "wilaya_code": "49",
    "name": "طالمين"
  },
  {
    "id": 1384,
    "wilaya_code": "49",
    "name": "تيميمون"
  },
  {
    "id": 1385,
    "wilaya_code": "49",
    "name": "تنركوك"
  },
  {
    "id": 1386,
    "wilaya_code": "50",
    "name": "برج باجي مختار"
  },
  {
    "id": 1387,
    "wilaya_code": "50",
    "name": "تيمياوين"
  },
  {
    "id": 1388,
    "wilaya_code": "51",
    "name": "بسباس"
  },
  {
    "id": 1389,
    "wilaya_code": "51",
    "name": "الشعيبة"
  },
  {
    "id": 1390,
    "wilaya_code": "51",
    "name": "الدوسن"
  },
  {
    "id": 1391,
    "wilaya_code": "51",
    "name": "أولاد جلال"
  },
  {
    "id": 1392,
    "wilaya_code": "51",
    "name": "رأس الميعاد"
  },
  {
    "id": 1393,
    "wilaya_code": "51",
    "name": "سيدي خالد"
  },
  {
    "id": 1394,
    "wilaya_code": "52",
    "name": "بني عباس"
  },
  {
    "id": 1395,
    "wilaya_code": "52",
    "name": "بن يخلف"
  },
  {
    "id": 1396,
    "wilaya_code": "52",
    "name": "الواتة"
  },
  {
    "id": 1397,
    "wilaya_code": "52",
    "name": "إقلي"
  },
  {
    "id": 1398,
    "wilaya_code": "52",
    "name": "كرزاز"
  },
  {
    "id": 1399,
    "wilaya_code": "52",
    "name": "القصابي"
  },
  {
    "id": 1400,
    "wilaya_code": "52",
    "name": "أولاد خضير"
  },
  {
    "id": 1401,
    "wilaya_code": "52",
    "name": "تامترت"
  },
  {
    "id": 1402,
    "wilaya_code": "52",
    "name": "تيمودي"
  },
  {
    "id": 1403,
    "wilaya_code": "53",
    "name": "عين صالح"
  },
  {
    "id": 1404,
    "wilaya_code": "53",
    "name": "فقارة الزوى"
  },
  {
    "id": 1405,
    "wilaya_code": "53",
    "name": "إينغر"
  },
  {
    "id": 1406,
    "wilaya_code": "54",
    "name": "عين قزام"
  },
  {
    "id": 1407,
    "wilaya_code": "54",
    "name": "تين زواتين"
  },
  {
    "id": 1408,
    "wilaya_code": "55",
    "name": "بن ناصر"
  },
  {
    "id": 1409,
    "wilaya_code": "55",
    "name": "بلدة اعمر"
  },
  {
    "id": 1410,
    "wilaya_code": "55",
    "name": "العالية"
  },
  {
    "id": 1411,
    "wilaya_code": "55",
    "name": "الحجيرة"
  },
  {
    "id": 1412,
    "wilaya_code": "55",
    "name": "المنقر"
  },
  {
    "id": 1413,
    "wilaya_code": "55",
    "name": "المقارين"
  },
  {
    "id": 1414,
    "wilaya_code": "55",
    "name": "النزلة"
  },
  {
    "id": 1415,
    "wilaya_code": "55",
    "name": "سيدي سليمان"
  },
  {
    "id": 1416,
    "wilaya_code": "55",
    "name": "الطيبات"
  },
  {
    "id": 1417,
    "wilaya_code": "55",
    "name": "تبسبست"
  },
  {
    "id": 1418,
    "wilaya_code": "55",
    "name": "تماسين"
  },
  {
    "id": 1419,
    "wilaya_code": "55",
    "name": "تقرت"
  },
  {
    "id": 1420,
    "wilaya_code": "55",
    "name": "الزاوية العابدية"
  },
  {
    "id": 1421,
    "wilaya_code": "56",
    "name": "برج الحواس"
  },
  {
    "id": 1422,
    "wilaya_code": "56",
    "name": "جانت"
  },
  {
    "id": 1423,
    "wilaya_code": "57",
    "name": "جامعة"
  },
  {
    "id": 1424,
    "wilaya_code": "57",
    "name": "المغير"
  },
  {
    "id": 1425,
    "wilaya_code": "57",
    "name": "المرارة"
  },
  {
    "id": 1426,
    "wilaya_code": "57",
    "name": "أم الطيور"
  },
  {
    "id": 1427,
    "wilaya_code": "57",
    "name": "سيدي عمران"
  },
  {
    "id": 1428,
    "wilaya_code": "57",
    "name": "سيدي خليل"
  },
  {
    "id": 1429,
    "wilaya_code": "57",
    "name": "سطيل"
  },
  {
    "id": 1430,
    "wilaya_code": "57",
    "name": "تندلة"
  },
  {
    "id": 1431,
    "wilaya_code": "58",
    "name": "المنيعة"
  },
  {
    "id": 1432,
    "wilaya_code": "58",
    "name": "حاسي الفحل"
  },
  {
    "id": 1433,
    "wilaya_code": "58",
    "name": "حاسي القارة"
  },
  {
    "id": 1434,
    "wilaya_code": "59",
    "name": "أفلو"
  },
  {
    "id": 1435,
    "wilaya_code": "59",
    "name": "عين سيدي علي"
  },
  {
    "id": 1436,
    "wilaya_code": "59",
    "name": "بريدة"
  },
  {
    "id": 1437,
    "wilaya_code": "59",
    "name": "البيضاء"
  },
  {
    "id": 1438,
    "wilaya_code": "59",
    "name": "الغيشة"
  },
  {
    "id": 1439,
    "wilaya_code": "59",
    "name": "قلتة سيدي سعد"
  },
  {
    "id": 1440,
    "wilaya_code": "59",
    "name": "الحاج مشري"
  },
  {
    "id": 1441,
    "wilaya_code": "59",
    "name": "وادي مزي"
  },
  {
    "id": 1442,
    "wilaya_code": "59",
    "name": "وادي مرة"
  },
  {
    "id": 1443,
    "wilaya_code": "59",
    "name": "سبقاق"
  },
  {
    "id": 1444,
    "wilaya_code": "59",
    "name": "سيدي بوزيد"
  },
  {
    "id": 1445,
    "wilaya_code": "59",
    "name": "تاويالة"
  },
  {
    "id": 1446,
    "wilaya_code": "60",
    "name": "عزيل عبد القادر"
  },
  {
    "id": 1447,
    "wilaya_code": "60",
    "name": "بريكة"
  },
  {
    "id": 1448,
    "wilaya_code": "60",
    "name": "بيطام"
  },
  {
    "id": 1449,
    "wilaya_code": "60",
    "name": "الجزار"
  },
  {
    "id": 1450,
    "wilaya_code": "60",
    "name": "إمدوكل"
  },
  {
    "id": 1451,
    "wilaya_code": "60",
    "name": "أولاد عمار"
  },
  {
    "id": 1452,
    "wilaya_code": "60",
    "name": "سقانة"
  },
  {
    "id": 1453,
    "wilaya_code": "60",
    "name": "تيلاطو"
  },
  {
    "id": 1454,
    "wilaya_code": "61",
    "name": "عين زعطوط"
  },
  {
    "id": 1455,
    "wilaya_code": "61",
    "name": "برانيس"
  },
  {
    "id": 1456,
    "wilaya_code": "61",
    "name": "جمورة"
  },
  {
    "id": 1457,
    "wilaya_code": "61",
    "name": "القنطرة"
  },
  {
    "id": 1458,
    "wilaya_code": "61",
    "name": "الوطاية"
  },
  {
    "id": 1459,
    "wilaya_code": "62",
    "name": "بئر العاتر"
  },
  {
    "id": 1460,
    "wilaya_code": "62",
    "name": "العقلة المالحة"
  },
  {
    "id": 1461,
    "wilaya_code": "62",
    "name": "فركان"
  },
  {
    "id": 1462,
    "wilaya_code": "62",
    "name": "نقرين"
  },
  {
    "id": 1463,
    "wilaya_code": "63",
    "name": "البويهي"
  },
  {
    "id": 1464,
    "wilaya_code": "63",
    "name": "العريشة"
  },
  {
    "id": 1465,
    "wilaya_code": "63",
    "name": "القور"
  },
  {
    "id": 1466,
    "wilaya_code": "63",
    "name": "سيدي الجيلالي"
  },
  {
    "id": 1467,
    "wilaya_code": "64",
    "name": "بوقرة"
  },
  {
    "id": 1468,
    "wilaya_code": "64",
    "name": "حمادية"
  },
  {
    "id": 1469,
    "wilaya_code": "64",
    "name": "قصر الشلالة"
  },
  {
    "id": 1470,
    "wilaya_code": "64",
    "name": "الرشايقة"
  },
  {
    "id": 1471,
    "wilaya_code": "64",
    "name": "سرغين"
  },
  {
    "id": 1472,
    "wilaya_code": "64",
    "name": "زمالة الأمير عبد القادر"
  },
  {
    "id": 1473,
    "wilaya_code": "65",
    "name": "عين فقه"
  },
  {
    "id": 1474,
    "wilaya_code": "65",
    "name": "عين وسارة"
  },
  {
    "id": 1475,
    "wilaya_code": "65",
    "name": "بنهار"
  },
  {
    "id": 1476,
    "wilaya_code": "65",
    "name": "بيرين"
  },
  {
    "id": 1477,
    "wilaya_code": "65",
    "name": "بويرة الأحداب"
  },
  {
    "id": 1478,
    "wilaya_code": "65",
    "name": "الخميس"
  },
  {
    "id": 1479,
    "wilaya_code": "65",
    "name": "قرنيني"
  },
  {
    "id": 1480,
    "wilaya_code": "65",
    "name": "حد الصحاري"
  },
  {
    "id": 1481,
    "wilaya_code": "65",
    "name": "حاسي فدول"
  },
  {
    "id": 1482,
    "wilaya_code": "65",
    "name": "سيدي لعجال"
  },
  {
    "id": 1483,
    "wilaya_code": "66",
    "name": "عمورة"
  },
  {
    "id": 1484,
    "wilaya_code": "66",
    "name": "دلدول"
  },
  {
    "id": 1485,
    "wilaya_code": "66",
    "name": "فيض البطمة"
  },
  {
    "id": 1486,
    "wilaya_code": "66",
    "name": "قطارة"
  },
  {
    "id": 1487,
    "wilaya_code": "66",
    "name": "مسعد"
  },
  {
    "id": 1488,
    "wilaya_code": "66",
    "name": "أم العظام"
  },
  {
    "id": 1489,
    "wilaya_code": "66",
    "name": "سد الرحال"
  },
  {
    "id": 1490,
    "wilaya_code": "66",
    "name": "سلمانة"
  },
  {
    "id": 1491,
    "wilaya_code": "67",
    "name": "عين بوسيف"
  },
  {
    "id": 1492,
    "wilaya_code": "67",
    "name": "عين اقصير"
  },
  {
    "id": 1493,
    "wilaya_code": "67",
    "name": "عزيز"
  },
  {
    "id": 1494,
    "wilaya_code": "67",
    "name": "بوغار"
  },
  {
    "id": 1495,
    "wilaya_code": "67",
    "name": "بوعيش"
  },
  {
    "id": 1496,
    "wilaya_code": "67",
    "name": "بوغزول"
  },
  {
    "id": 1497,
    "wilaya_code": "67",
    "name": "الشهبونية"
  },
  {
    "id": 1498,
    "wilaya_code": "67",
    "name": "شلالة العذاورة"
  },
  {
    "id": 1499,
    "wilaya_code": "67",
    "name": "شنيقل"
  },
  {
    "id": 1500,
    "wilaya_code": "67",
    "name": "دراق"
  },
  {
    "id": 1501,
    "wilaya_code": "67",
    "name": "العوينات"
  },
  {
    "id": 1502,
    "wilaya_code": "67",
    "name": "الكاف الاخضر"
  },
  {
    "id": 1503,
    "wilaya_code": "67",
    "name": "قصر البخاري"
  },
  {
    "id": 1504,
    "wilaya_code": "67",
    "name": "مفاتحة"
  },
  {
    "id": 1505,
    "wilaya_code": "67",
    "name": "أولاد عنتر"
  },
  {
    "id": 1506,
    "wilaya_code": "67",
    "name": "أولاد امعرف"
  },
  {
    "id": 1507,
    "wilaya_code": "67",
    "name": "أولاد هلال"
  },
  {
    "id": 1508,
    "wilaya_code": "67",
    "name": "أم الجليل"
  },
  {
    "id": 1509,
    "wilaya_code": "67",
    "name": "السانق"
  },
  {
    "id": 1510,
    "wilaya_code": "67",
    "name": "سيدي دامد"
  },
  {
    "id": 1511,
    "wilaya_code": "67",
    "name": "تفراوت"
  },
  {
    "id": 1512,
    "wilaya_code": "68",
    "name": "عين الملح"
  },
  {
    "id": 1513,
    "wilaya_code": "68",
    "name": "عين فارس"
  },
  {
    "id": 1514,
    "wilaya_code": "68",
    "name": "عين الريش"
  },
  {
    "id": 1515,
    "wilaya_code": "68",
    "name": "بن سرور"
  },
  {
    "id": 1516,
    "wilaya_code": "68",
    "name": "بن زوه"
  },
  {
    "id": 1517,
    "wilaya_code": "68",
    "name": "بئر فضة"
  },
  {
    "id": 1518,
    "wilaya_code": "68",
    "name": "بوسعادة"
  },
  {
    "id": 1519,
    "wilaya_code": "68",
    "name": "جبل مساعد"
  },
  {
    "id": 1520,
    "wilaya_code": "68",
    "name": "الهامل"
  },
  {
    "id": 1521,
    "wilaya_code": "68",
    "name": "الحوامد"
  },
  {
    "id": 1522,
    "wilaya_code": "68",
    "name": "خبانة"
  },
  {
    "id": 1523,
    "wilaya_code": "68",
    "name": "مسيف"
  },
  {
    "id": 1524,
    "wilaya_code": "68",
    "name": "امجدل"
  },
  {
    "id": 1525,
    "wilaya_code": "68",
    "name": "مناعة"
  },
  {
    "id": 1526,
    "wilaya_code": "68",
    "name": "محمد بوضياف"
  },
  {
    "id": 1527,
    "wilaya_code": "68",
    "name": "أولاد سيدي ابراهيم"
  },
  {
    "id": 1528,
    "wilaya_code": "68",
    "name": "أولاد سليمان"
  },
  {
    "id": 1529,
    "wilaya_code": "68",
    "name": "ولتام"
  },
  {
    "id": 1530,
    "wilaya_code": "68",
    "name": "سيدي عامر"
  },
  {
    "id": 1531,
    "wilaya_code": "68",
    "name": "سيدي محمد"
  },
  {
    "id": 1532,
    "wilaya_code": "68",
    "name": "سليم"
  },
  {
    "id": 1533,
    "wilaya_code": "68",
    "name": "تامسة"
  },
  {
    "id": 1534,
    "wilaya_code": "68",
    "name": "زرزور"
  },
  {
    "id": 1535,
    "wilaya_code": "69",
    "name": "عين العراك"
  },
  {
    "id": 1536,
    "wilaya_code": "69",
    "name": "اربوات"
  },
  {
    "id": 1537,
    "wilaya_code": "69",
    "name": "بوسمغون"
  },
  {
    "id": 1538,
    "wilaya_code": "69",
    "name": "شلالة"
  },
  {
    "id": 1539,
    "wilaya_code": "69",
    "name": "البنود"
  },
  {
    "id": 1540,
    "wilaya_code": "69",
    "name": "المحرة"
  },
  {
    "id": 1541,
    "wilaya_code": "69",
    "name": "الأبيض سيدي الشيخ"
  }
];
