import React, { useState, useRef, useEffect } from 'react';
import type { Product, Category } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { formatDA } from '@/lib/format';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  toggleProductMarketAvailability,
} from '@/lib/api';
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Layers,
  UploadCloud,
  ImageIcon,
  Loader2,
  AlertTriangle,
  Check,
  X,
  MoreVertical,
  Search,
  Barcode,
  TrendingUp,
  Boxes,
  Eye,
  EyeOff,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Printer,
} from 'lucide-react';

interface ProductManagerProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => Promise<void>;
  isRTL: boolean;
  language: string;
}

export default function ProductManager({
  products,
  categories,
  onRefresh,
  isRTL,
  language,
}: ProductManagerProps) {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [unit, setUnit] = useState('حبة');
  const [barcode, setBarcode] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Pack / Carton states
  const [enablePack, setEnablePack] = useState(false);
  const [unitsPerPack, setUnitsPerPack] = useState<string>('12');
  const [packLabel, setPackLabel] = useState('كرتونة');
  const [packPrice, setPackPrice] = useState<string>('');

  // 3-dots action menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // File upload state & ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Processing & Error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Outside click listener for 3-dots menu
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenuId]);

  // Labels dictionary
  const txt = {
    title:
      language === 'fr'
        ? 'Gestion des Produits & Tarification'
        : language === 'en'
        ? 'Product Catalog & Pricing'
        : 'إدارة المنتجات والتسعير المزدوج',
    subtitle:
      language === 'fr'
        ? 'Ajoutez vos articles, configurez la vente à l’unité et au carton, et suivez vos marges bénéficiaires'
        : language === 'en'
        ? 'Manage articles, configure piece and carton wholesale pricing, and track profit margins'
        : 'أضف سلعك، حدد أسعار البيع بالحبة والكرتونة، وتتبع أرباحك وتكاليف الجملة بدقة',
    addBtn:
      language === 'fr'
        ? 'Nouveau Produit'
        : language === 'en'
        ? 'New Product'
        : 'إضافة منتج جديد',
    searchPlaceholder:
      language === 'fr'
        ? 'Rechercher par nom ou code-barres...'
        : language === 'en'
        ? 'Search by name or barcode...'
        : 'ابحث باسم المنتج أو الباركود...',
    allCategories: language === 'fr' ? 'Tous les rayons' : language === 'en' ? 'All categories' : 'جميع الأقسام',
    emptyTitle:
      language === 'fr' ? 'Aucun produit enregistré' : language === 'en' ? 'No products yet' : 'لا توجد منتجات مسجلة',
    emptyDesc:
      language === 'fr'
        ? 'Commencez par ajouter votre premier produit avec ses tarifs de vente et d’achat.'
        : language === 'en'
        ? 'Start by adding your first wholesale item with single and carton rates.'
        : 'ابدأ بإضافة أول سلعة في متجرك وحدد سعر الحبة وسعر الكرتونة المخفض.',
    nameLabel: language === 'fr' ? 'Nom du produit *' : language === 'en' ? 'Product Name *' : 'اسم المنتج *',
    categoryLabel: language === 'fr' ? 'Rayon / Catégorie *' : language === 'en' ? 'Category *' : 'القسم التابع له *',
    selectCategory: language === 'fr' ? '-- Choisir un rayon --' : language === 'en' ? '-- Select a category --' : '-- اختر القسم --',
    descLabel: language === 'fr' ? 'Description (optionnel)' : language === 'en' ? 'Description (optional)' : 'الوصف (اختياري)',
    singlePriceLabel: language === 'fr' ? 'Prix unitaire de vente (DA) *' : language === 'en' ? 'Piece Selling Price (DA) *' : 'سعر بيع الحبة المفردة (دج) *',
    costPriceLabel: language === 'fr' ? 'Prix de revient / Achat (DA) (Secret)' : language === 'en' ? 'Cost Price (DA) (Private)' : 'سعر التكلفة من سوق الجملة (دج) (خاص بك)',
    costPriceHint: language === 'fr' ? 'Visible uniquement par vous pour calculer vos marges réelles' : 'خاص بك وحدك لحساب هامش ربحك وتجهيز مشتريات السوق',
    packToggle: language === 'fr' ? 'Activer la vente au carton / fardeau' : language === 'en' ? 'Enable carton / pack wholesale' : 'تفعيل خيار البيع بالكرتونة / الفاردو',
    unitsPerPackLabel: language === 'fr' ? 'Nombre de pièces par carton' : language === 'en' ? 'Units per carton' : 'عدد الحبات في الكرتونة',
    packLabelInput: language === 'fr' ? 'Nom du colis (ex: Carton, Fardeau)' : language === 'en' ? 'Pack label (Carton, Box)' : 'تسمية العبوة (مثال: كرتونة، فاردو)',
    packPiecePriceLabel: language === 'fr' ? 'Prix unitaire au carton (DA)' : language === 'en' ? 'Piece price in carton (DA)' : 'سعر الحبة عند شراء كرتونة كاملة (دج)',
    barcodeLabel: language === 'fr' ? 'Code-barres (EAN / SKU)' : language === 'en' ? 'Barcode (EAN / SKU)' : 'الباركود الدولي أو المحلي',
    uploadBtn: language === 'fr' ? 'Photo du produit depuis l’appareil' : language === 'en' ? 'Upload product image' : 'رفع صورة المنتج من الهاتف أو الحاسوب',
    cancel: language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'إلغاء',
    save: language === 'fr' ? 'Enregistrer' : language === 'en' ? 'Save' : 'حفظ التعديلات',
    create: language === 'fr' ? 'Créer le produit' : language === 'en' ? 'Create' : 'إضافة المنتج',
    deleteTitle: language === 'fr' ? 'Supprimer ce produit ?' : language === 'en' ? 'Delete this product?' : 'تأكيد حذف المنتج',
    deleteConfirm: language === 'fr' ? 'Oui, supprimer' : language === 'en' ? 'Yes, Delete' : 'نعم، حذف',
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setDescription('');
    setPrice('');
    setCostPrice('');
    setUnit('حبة');
    setBarcode('');
    setImageUrl('');
    setEnablePack(false);
    setUnitsPerPack('12');
    setPackLabel(language === 'fr' ? 'Carton' : 'كرتونة');
    setPackPrice('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategoryId(p.category_id);
    setDescription(p.description || '');
    setPrice(String(p.price));
    setCostPrice(p.cost_price ? String(p.cost_price) : '');
    setUnit(p.unit || 'حبة');
    setBarcode(p.barcode || '');
    setImageUrl(p.image_url || '');
    setEnablePack(!!p.units_per_pack && p.units_per_pack > 1);
    setUnitsPerPack(p.units_per_pack ? String(p.units_per_pack) : '12');
    setPackLabel(p.pack_label || (language === 'fr' ? 'Carton' : 'كرتونة'));
    setPackPrice(p.pack_price ? String(p.pack_price) : '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Handle Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setErrorMsg('');

    try {
      const res = await uploadProductImage(file);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.url) {
        setImageUrl(res.url);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg(language === 'fr' ? 'Veuillez saisir le nom du produit' : 'يرجى كتابة اسم المنتج');
      return;
    }

    if (!categoryId) {
      setErrorMsg(language === 'fr' ? 'Veuillez sélectionner un rayon' : 'يرجى اختيار القسم التابع له المنتج');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg(language === 'fr' ? 'Veuillez saisir un prix unitaire valide' : 'يرجى كتابة سعر بيع صحيح للحبة');
      return;
    }

    const costNum = costPrice ? parseFloat(costPrice) : null;
    const unitsNum = enablePack ? parseInt(unitsPerPack) : null;
    const packPriceNum = enablePack && packPrice ? parseFloat(packPrice) : null;

    setIsSubmitting(true);

    try {
      if (editingProduct) {
        const res = await updateProduct(editingProduct.id, {
          name: name.trim(),
          category_id: categoryId,
          description: description.trim() || null,
          price: priceNum,
          cost_price: costNum && !isNaN(costNum) ? costNum : null,
          unit: unit.trim() || 'حبة',
          barcode: barcode.trim() || null,
          image_url: imageUrl || null,
          units_per_pack: unitsNum && !isNaN(unitsNum) && unitsNum > 1 ? unitsNum : null,
          pack_label: enablePack ? (packLabel.trim() || 'كرتونة') : null,
          pack_price: packPriceNum && !isNaN(packPriceNum) ? packPriceNum : null,
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(language === 'fr' ? 'Produit modifié avec succès' : 'تم تعديل المنتج بنجاح');
          setIsModalOpen(false);
          await onRefresh();
          setTimeout(() => setSuccessMsg(''), 3000);
        }
      } else {
        const res = await createProduct({
          name: name.trim(),
          category_id: categoryId,
          description: description.trim() || null,
          price: priceNum,
          cost_price: costNum && !isNaN(costNum) ? costNum : null,
          unit: unit.trim() || 'حبة',
          barcode: barcode.trim() || null,
          image_url: imageUrl || null,
          units_per_pack: unitsNum && !isNaN(unitsNum) && unitsNum > 1 ? unitsNum : null,
          pack_label: enablePack ? (packLabel.trim() || 'كرتونة') : null,
          pack_price: packPriceNum && !isNaN(packPriceNum) ? packPriceNum : null,
          sort_order: products.length + 1,
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(language === 'fr' ? 'Produit ajouté avec succès' : 'تمت إضافة المنتج الجديد بنجاح');
          setIsModalOpen(false);
          await onRefresh();
          setTimeout(() => setSuccessMsg(''), 3000);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!deleteModalProduct) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await deleteProduct(deleteModalProduct.id);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(language === 'fr' ? 'Produit supprimé' : 'تم حذف المنتج بنجاح');
        setDeleteModalProduct(null);
        await onRefresh();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Market Outage Toggle
  const handleToggleOutage = async (product: Product) => {
    setActionLoadingId(product.id);
    try {
      const newStatus = !product.market_unavailable;
      const success = await toggleProductMarketAvailability(product.id, newStatus);
      if (success) {
        await onRefresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Generate internal SKU barcode (FW-XXXXXX)
  const generateAutoBarcode = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setBarcode(`FW-${randomNum}`);
  };

  // Print Standard Thermal Label for Warehouse Boxes & Shelves
  const handlePrintLabel = (product: Product) => {
    const printWindow = window.open('', '_blank', 'width=450,height=420');
    if (!printWindow) return;
    const barcodeValue = product.barcode || `FW-${product.id.slice(0, 8).toUpperCase()}`;
    const categoryName = categories.find((c) => c.id === product.category_id)?.name || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>Fox Way Label - ${product.name}</title>
        <style>
          @page { size: auto; margin: 4mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 10px;
            text-align: center;
            color: #000;
            background: #fff;
          }
          .label-card {
            border: 2.5px solid #000;
            border-radius: 12px;
            padding: 12px;
            max-width: 320px;
            margin: 0 auto;
            box-sizing: border-box;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1.5px solid #000;
            padding-bottom: 4px;
            margin-bottom: 8px;
            font-size: 11px;
            font-weight: 800;
          }
          .title {
            font-size: 16px;
            font-weight: 900;
            line-height: 1.25;
            margin-bottom: 8px;
            word-break: break-word;
          }
          .price-badge {
            background: #000;
            color: #fff;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 22px;
            font-weight: 900;
            display: inline-block;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
          }
          .pack-details {
            font-size: 12px;
            font-weight: 800;
            margin-bottom: 8px;
            padding: 4px;
            background: #f0f0f0;
            border-radius: 6px;
            border: 1px dashed #666;
          }
          .barcode-wrap {
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid #ccc;
          }
          .fake-bars {
            font-family: monospace;
            font-size: 22px;
            letter-spacing: 4px;
            font-weight: 900;
            line-height: 1;
            margin: 4px 0;
          }
          .barcode-text {
            font-family: monospace;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 2px;
          }
        </style>
      </head>
      <body>
        <div class="label-card">
          <div class="header">
            <span>FOX WAY • منصة الجملة</span>
            <span>${categoryName}</span>
          </div>
          <div class="title">${product.name}</div>
          <div>
            <span class="price-badge">${product.price} DA</span>
          </div>
          ${
            product.units_per_pack
              ? `<div class="pack-details">📦 ${product.pack_label || 'كرتونة'}: ${product.units_per_pack} وحدة ${
                  product.pack_price ? `(${product.pack_price} DA للوحدة)` : ''
                }</div>`
              : ''
          }
          <div class="barcode-wrap">
            <div class="fake-bars">|||| | ||| |||| | ||| | ||||</div>
            <div class="barcode-text">${barcodeValue}</div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtered Products List
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategoryFilter === 'all' || p.category_id === selectedCategoryFilter;
    if (!matchesCategory) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const nameMatch = p.name.toLowerCase().includes(term);
    const barcodeMatch = p.barcode ? p.barcode.toLowerCase().includes(term) : false;
    const descMatch = p.description ? p.description.toLowerCase().includes(term) : false;

    return nameMatch || barcodeMatch || descMatch;
  });

  // Profit calculation for the form
  const numPrice = parseFloat(price) || 0;
  const numCost = parseFloat(costPrice) || 0;
  const unitProfit = numPrice > 0 && numCost > 0 ? numPrice - numCost : null;
  const profitMarginPercent = unitProfit !== null && numCost > 0 ? ((unitProfit / numCost) * 100).toFixed(1) : null;

  // Pack calculations for the form
  const numUnits = parseInt(unitsPerPack) || 0;
  const numPackPiecePrice = parseFloat(packPrice) || numPrice;
  const totalPackPrice = numUnits > 0 ? numPackPiecePrice * numUnits : 0;
  const totalPackSavings = numUnits > 0 && numPrice > numPackPiecePrice ? (numPrice - numPackPiecePrice) * numUnits : 0;

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {txt.title}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xl">
            {txt.subtitle}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-sm shadow-emerald-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{txt.addBtn}</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in-up">
          <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Category Pills & Search Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategoryFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:border-emerald-500/40'
            }`}
          >
            {txt.allCategories} ({products.length})
          </button>

          {categories.map((c) => {
            const count = products.filter((p) => p.category_id === c.id).length;
            const catLabel = language === 'fr' ? (c.name_fr || c.name) : c.name;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedCategoryFilter === c.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:border-emerald-500/40'
                }`}
              >
                {catLabel} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={txt.searchPlaceholder}
            className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
          />
        </div>
      </div>

      {/* Products Grid or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-zinc-800/80 rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-500 dark:text-emerald-400">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {txt.emptyTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto mt-1 mb-5">
            {txt.emptyDesc}
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{txt.addBtn}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => {
            const cat = categories.find((c) => c.id === p.category_id);
            const localizedCatName = cat ? (language === 'fr' ? (cat.name_fr || cat.name) : cat.name) : '';
            const isPack = !!p.units_per_pack && p.units_per_pack > 1;
            const singlePackSavings = isPack && p.pack_price && p.price > p.pack_price
              ? (p.price - p.pack_price) * p.units_per_pack!
              : 0;

            const unitProfitVal = p.price && p.cost_price ? p.price - p.cost_price : null;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:shadow-lg transition-all group flex flex-col justify-between"
              >
                <div>
                  {/* Product Image Showcase */}
                  <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 dark:bg-black border border-slate-200 dark:border-zinc-800 mb-3 flex items-center justify-center p-2">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-zinc-600 gap-1">
                        <ImageIcon className="w-6 h-6 opacity-40" />
                        <span className="text-[10px]">
                          {language === 'fr' ? 'Sans photo' : 'بدون صورة'}
                        </span>
                      </div>
                    )}

                    {/* Category pill on image */}
                    {localizedCatName && (
                      <span className="absolute top-2 start-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                        {localizedCatName}
                      </span>
                    )}

                    {/* Market Outage Banner if unavailable */}
                    {p.market_unavailable && (
                      <span className="absolute bottom-2 inset-x-2 py-1 rounded-lg bg-rose-600/90 backdrop-blur-md text-[11px] font-bold text-white text-center shadow-md flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{language === 'fr' ? 'Rupture marché' : 'منقطع من السوق'}</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Barcode */}
                  <div className="mb-2">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                      {p.name}
                    </h3>
                    {p.barcode && (
                      <p className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5" dir="ltr">
                        <Barcode className="w-3.5 h-3.5" />
                        <span>{p.barcode}</span>
                      </p>
                    )}
                  </div>

                  {/* Pricing Details */}
                  <div className="space-y-1.5 pt-1">
                    {/* Single Piece Price */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-zinc-400">
                        {language === 'fr' ? 'Prix à l’unité :' : 'سعر البيع بالحبة:'}
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {formatDA(p.price)} / {p.unit}
                      </span>
                    </div>

                    {/* Pack / Carton Price */}
                    {isPack && (
                      <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs">
                        <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                          <span className="flex items-center gap-1">
                            <Boxes className="w-3.5 h-3.5" />
                            <span>{p.pack_label || 'كرتونة'} ({p.units_per_pack} {p.unit}) :</span>
                          </span>
                          <span>
                            {formatDA((p.pack_price ?? p.price) * p.units_per_pack!)}
                          </span>
                        </div>
                        {singlePackSavings > 0 && (
                          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {language === 'fr' ? `Économie client : ${formatDA(singlePackSavings)}` : `توفير للزبون: ${formatDA(singlePackSavings)}`}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Admin Secret Cost & Margin */}
                    {p.cost_price && (
                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/60">
                        <span>
                          {language === 'fr' ? 'Achat :' : 'التكلفة :'} <strong className="text-slate-700 dark:text-zinc-300">{formatDA(p.cost_price)}</strong>
                        </span>
                        {unitProfitVal !== null && (
                          <span className={`font-bold flex items-center gap-0.5 ${unitProfitVal > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                            <TrendingUp className="w-3 h-3" />
                            <span>{unitProfitVal > 0 ? `+${formatDA(unitProfitVal)}` : formatDA(unitProfitVal)}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Outage Switch & 3-Dots Action */}
                <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
                  {/* Market Outage Quick Toggle */}
                  <button
                    type="button"
                    disabled={actionLoadingId === p.id}
                    onClick={() => handleToggleOutage(p)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
                      p.market_unavailable
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100'
                        : 'bg-slate-100 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-emerald-500/50'
                    }`}
                  >
                    {actionLoadingId === p.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : p.market_unavailable ? (
                      <Ban className="w-3 h-3" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    )}
                    <span>
                      {p.market_unavailable
                        ? (language === 'fr' ? 'Rupture' : 'منقطع')
                        : (language === 'fr' ? 'Disponible' : 'متوفر')}
                    </span>
                  </button>

                  {/* 3-Dots Professional Actions Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === p.id ? null : p.id);
                      }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                      title={language === 'fr' ? 'Actions' : 'خيارات المنتج'}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === p.id && (
                      <div
                        className={`absolute bottom-full mb-2 ${isRTL ? 'left-0' : 'right-0'} z-30 min-w-[145px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-1.5 shadow-2xl animate-scale-in`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            handlePrintLabel(p);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{language === 'fr' ? 'Imprimer étiquette' : language === 'en' ? 'Print Label' : 'طباعة ملصق الباركود'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            openEditModal(p);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{language === 'fr' ? 'Modifier' : language === 'en' ? 'Edit' : 'تعديل المنتج'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            setDeleteModalProduct(p);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>{language === 'fr' ? 'Supprimer' : language === 'en' ? 'Delete' : 'حذف المنتج'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingProduct
                    ? (language === 'fr' ? 'Modifier le produit' : language === 'en' ? 'Edit Product' : 'تعديل بيانات المنتج')
                    : (language === 'fr' ? 'Ajouter un nouveau produit' : language === 'en' ? 'Add New Product to Catalog' : 'إضافة منتج جديد للكتالوج')}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  {txt.nameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'fr' ? 'Ex: Shampoing Sunsilk 400ml Jaune' : 'مثال: شامبو صانسيلك 400 مل أصفر، ماكينة حلاقة بيك...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  {txt.categoryLabel}
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  <option value="">{txt.selectCategory}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {language === 'fr' ? (c.name_fr || c.name) : c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pricing Grid: Single Piece Price + Secret Cost Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80">
                {/* Selling Price per Piece */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    {txt.singlePriceLabel}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="320"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-mono font-bold text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                    <span className="absolute top-1/2 -translate-y-1/2 end-3 text-xs font-bold text-slate-400">
                      دج
                    </span>
                  </div>
                </div>

                {/* Cost Price (Private for Admin) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                      {txt.costPriceLabel}
                    </label>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">
                      🔒 {language === 'fr' ? 'Secret' : 'سري'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="270"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-mono font-bold text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                    <span className="absolute top-1/2 -translate-y-1/2 end-3 text-xs font-bold text-slate-400">
                      دج
                    </span>
                  </div>
                  {unitProfit !== null && (
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {language === 'fr'
                        ? `Marge : +${formatDA(unitProfit)} (+${profitMarginPercent}%)`
                        : language === 'en'
                        ? `Profit Margin: +${formatDA(unitProfit)} (+${profitMarginPercent}%)`
                        : `هامش ربحك: +${formatDA(unitProfit)} (+${profitMarginPercent}%)`}
                    </p>
                  )}
                </div>
              </div>

              {/* Pack / Carton Wholesale Configuration Section */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/[0.03] border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enablePack}
                      onChange={(e) => setEnablePack(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-zinc-700"
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {txt.packToggle}
                    </span>
                  </label>
                  <Boxes className="w-4 h-4 text-emerald-500" />
                </div>

                {enablePack && (
                  <div className="pt-2 space-y-3 animate-fade-in border-t border-emerald-500/10">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Units per pack */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                          {txt.unitsPerPackLabel}
                        </label>
                        <input
                          type="number"
                          min="2"
                          value={unitsPerPack}
                          onChange={(e) => setUnitsPerPack(e.target.value)}
                          placeholder="12"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono font-bold focus:border-emerald-500 outline-none"
                        />
                      </div>

                      {/* Pack unit label */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                          {txt.packLabelInput}
                        </label>
                        <input
                          type="text"
                          value={packLabel}
                          onChange={(e) => setPackLabel(e.target.value)}
                          placeholder="كرتونة / علبة / فاردو"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:border-emerald-500 outline-none"
                        />
                      </div>

                      {/* Pack piece price */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                          {txt.packPiecePriceLabel}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={packPrice}
                          onChange={(e) => setPackPrice(e.target.value)}
                          placeholder={price || '300'}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono font-bold focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Calculated Pack Summary Box */}
                    {totalPackPrice > 0 && (
                      <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                        <div>
                          <span className="text-slate-500 dark:text-zinc-400">
                            {language === 'fr' ? 'Prix total carton :' : 'سعر الكرتونة الإجمالي:'}{' '}
                          </span>
                          <strong className="text-slate-900 dark:text-white font-mono text-sm">
                            {formatDA(totalPackPrice)}
                          </strong>
                        </div>
                        {totalPackSavings > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                            🎉 {language === 'fr' ? `Économie client : ${formatDA(totalPackSavings)}` : `توفير للزبون: ${formatDA(totalPackSavings)}`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Barcode & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Barcode className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{txt.barcodeLabel}</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateAutoBarcode}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold underline transition-colors"
                      title={language === 'fr' ? 'Générer code interne (FW-XXXXXX)' : language === 'en' ? 'Generate internal SKU' : 'توليد باركود داخلي للسلع التي لا تملك باركود'}
                    >
                      ⚡ {language === 'fr' ? 'Générer SKU' : language === 'en' ? 'Auto SKU (FW-)' : 'توليد تلقائي (FW-)'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="6191234567890"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 text-xs font-mono focus:border-emerald-500 outline-none"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    {txt.descLabel}
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={language === 'fr' ? 'Courte note ou spécification...' : language === 'en' ? 'Short note or details...' : 'ملاحظة مختصرة أو تفاصيل عن المنتج...'}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Direct Product Image Upload Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{language === 'fr' ? 'Photo réelle du produit' : language === 'en' ? 'Product real photo' : 'صورة المنتج الحقيقية'}</span>
                  </span>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      {language === 'fr' ? 'Supprimer la photo' : 'إزالة الصورة'}
                    </button>
                  )}
                </div>

                {imageUrl ? (
                  <div className="relative w-full h-32 rounded-xl bg-black border border-slate-200 dark:border-zinc-800 flex items-center justify-center p-2 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Aperçu"
                      className="max-h-full max-w-full object-contain filter drop-shadow-md"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                    className={`w-full py-5 px-4 rounded-2xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-emerald-500/[0.04] transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
                      isUploadingImage ? 'opacity-70 pointer-events-none' : ''
                    }`}
                  >
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center gap-2 py-1">
                        <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {language === 'fr' ? 'Téléversement de l’image...' : 'جارٍ رفع صورة المنتج...'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 shadow-sm border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {txt.uploadBtn}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          {language === 'fr' ? 'Prenez en photo depuis votre téléphone ou choisissez un fichier' : 'صوّر المنتج بهاتفك أو اختر صورة من المعرض'}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800 mt-5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {txt.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProduct ? txt.save : txt.create}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Product */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-sm bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-center space-y-4 animate-scale-in"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                {txt.deleteTitle}
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                {language === 'fr'
                  ? `Voulez-vous vraiment supprimer "${deleteModalProduct.name}" ?`
                  : `هل أنت متأكد من حذف المنتج "${deleteModalProduct.name}" نهائياً من المتجر؟`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDeleteModalProduct(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {txt.cancel}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{txt.deleteConfirm}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
