import React, { useState, useEffect, useRef } from 'react';
import type { Category, Product } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { createCategory, updateCategory, deleteCategory, uploadBrandImage } from '@/lib/api';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  Package,
  AlertTriangle,
  Loader2,
  Check,
  X,
  ArrowUpDown,
  ImageIcon,
  UploadCloud,
  ImagePlus,
  Link as LinkIcon,
  MoreVertical,
} from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  products: Product[];
  onRefresh: () => Promise<void>;
  isRTL: boolean;
  language: string;
}

// Mini dynamic brand banner preview component
function BrandBannerPreview({ images, alt }: { images: string[]; alt: string }) {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[16/9] rounded-xl bg-slate-100 dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-800 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 gap-1">
        <ImageIcon className="w-5 h-5 opacity-60" />
        <span className="text-[11px]">
          {language === 'fr' ? 'Aucun logo de marque' : 'لا توجد شعارات ماركات مضافة'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-zinc-800 shadow-inner group">
      {/* Brand logo transition filling 100% of 16:9 container */}
      <img
        src={images[currentIndex]}
        alt={`${alt} - brand ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-all duration-500 transform scale-100 animate-fade-in group-hover:scale-105"
        key={currentIndex}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
}

export default function CategoryManager({
  categories,
  products,
  onRefresh,
  isRTL,
  language,
}: CategoryManagerProps) {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteModalCategory, setDeleteModalCategory] = useState<Category | null>(null);

  // Form states
  const [nameAr, setNameAr] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [brandImages, setBrandImages] = useState<string[]>([]);
  const [newBrandUrl, setNewBrandUrl] = useState('');
  const [showUrlFallback, setShowUrlFallback] = useState(false);

  // File upload state & ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingBrand, setIsUploadingBrand] = useState(false);
  const [brandIndexToDelete, setBrandIndexToDelete] = useState<number | null>(null);

  // 3-dots action menu state
  const [activeMenuCategoryId, setActiveMenuCategoryId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuCategoryId(null);
    if (activeMenuCategoryId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenuCategoryId]);

  // Processing & Error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Translations dictionary
  const txt = {
    title:
      language === 'fr'
        ? 'Gestion des Rayons & Marques'
        : language === 'en'
        ? 'Departments & Brand Banners'
        : 'إدارة الأقسام واللافتات الإشهارية للماركات',
    subtitle:
      language === 'fr'
        ? 'Configurez les rayons et ajoutez les logos de vos marques pour créer des bannières animées'
        : language === 'en'
        ? 'Set up department categories and add brand logos for dynamic rotating billboard showcases'
        : 'أنشئ أقسام متجرك وأضف شعارات ماركاتك لتظهر كشاشات إشهارية متحركة تجذب الزبائن',
    addBtn:
      language === 'fr'
        ? 'Nouveau Rayon'
        : language === 'en'
        ? 'New Department'
        : 'إضافة قسم جديد',
    emptyTitle:
      language === 'fr'
        ? 'Aucun rayon pour le moment'
        : language === 'en'
        ? 'No categories yet'
        : 'لا توجد أقسام مسجلة حتى الآن',
    emptyDesc:
      language === 'fr'
        ? 'Créez votre premier rayon et insérez les logos de vos marques (Nivea, Garnier, Venus...)'
        : language === 'en'
        ? 'Create your first category and add your brand logos (Nivea, Garnier, Gillette...)'
        : 'أنشئ أول قسم لتجارتك وأضف شعارات ماركاتك التابعة له لتظهر كلافتة إشهارية متحركة',
    nameArLabel:
      language === 'fr'
        ? 'Nom du rayon (Arabe) *'
        : language === 'en'
        ? 'Department Name (Arabic) *'
        : 'اسم القسم بالعربية *',
    nameArPlaceholder:
      language === 'fr'
        ? 'Ex: Cosmétiques & Beauté, Bazar, Hygiène corporelle...'
        : language === 'en'
        ? 'Ex: Cosmetics & Beauty, Bazaar, Body care...'
        : 'مثال: كوسميتيك وتجميل، خردوات وبازار، تنظيف بدني...',
    nameFrLabel:
      language === 'fr'
        ? 'Nom du rayon (Français - optionnel)'
        : language === 'en'
        ? 'Department Name (French - optional)'
        : 'اسم القسم بالفرنسية (اختياري)',
    nameFrPlaceholder:
      language === 'fr'
        ? 'Ex: Cosmétiques & Beauté, Bazar & Quincaillerie...'
        : language === 'en'
        ? 'Ex: Cosmetics & Beauty, Bazaar & Hardware...'
        : 'اسم القسم بالفرنسية (مثال: Cosmétiques & Beauté)...',
    brandsTitle:
      language === 'fr'
        ? 'Logos des Marques (Bannière publicitaire animée)'
        : language === 'en'
        ? 'Brand Logos (Animated Showcase Banner)'
        : 'شعارات العلامات التجارية (اللافتة الإشهارية المتحركة للقسم)',
    brandsDesc:
      language === 'fr'
        ? 'Ajoutez les images des marques disponibles dans ce rayon pour créer une bannière rotative'
        : language === 'en'
        ? 'Add logos of brands stocked in this category to cycle automatically on the storefront'
        : 'أضف صور وشعارات الماركات المتوفرة في هذا القسم لتتحرك بالتناوب أمام الزبائن',
    uploadBrandBtn:
      language === 'fr'
        ? 'Choisir des images depuis l’appareil / téléphone'
        : language === 'en'
        ? 'Upload brand logos from device / phone'
        : 'رفع صور الماركات من الهاتف أو الحاسوب',
    uploadBrandHint:
      language === 'fr'
        ? 'Sélectionnez un ou plusieurs logos (PNG, JPG, WEBP). Résolution carrée ou transparente recommandée.'
        : language === 'en'
        ? 'Select one or multiple logos (PNG, JPG, WEBP). Square or transparent recommended.'
        : 'حدد صورة واحدة أو عدة صور معاً (PNG, JPG, WEBP). يفضل خلفية شفافة أو مربعة.',
    uploadingBrands:
      language === 'fr'
        ? 'Téléversement des logos en cours...'
        : language === 'en'
        ? 'Uploading brand logos...'
        : 'جارٍ رفع صور الماركات إلى المتجر...',
    addBrandPlaceholder:
      language === 'fr'
        ? 'Ou collez le lien de l\'image (URL)...'
        : language === 'en'
        ? 'Or paste image link (URL)...'
        : 'أو ألصق رابط الصورة مباشرة (URL)...',
    addBrandBtn:
      language === 'fr' ? 'Ajouter par lien' : language === 'en' ? 'Add via Link' : 'إضافة بالرابط',
    orderLabel:
      language === 'fr'
        ? "Ordre d'affichage"
        : language === 'en'
        ? 'Display Sort Order'
        : 'ترتيب ظهور القسم',
    cancel: language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'إلغاء',
    save: language === 'fr' ? 'Enregistrer' : language === 'en' ? 'Save' : 'حفظ التعديلات',
    create: language === 'fr' ? 'Créer le rayon' : language === 'en' ? 'Create' : 'إنشاء القسم',
    deleteTitle:
      language === 'fr'
        ? 'Supprimer ce rayon ?'
        : language === 'en'
        ? 'Delete category?'
        : 'تأكيد حذف القسم',
    deleteConfirm:
      language === 'fr' ? 'Confirmer la suppression' : language === 'en' ? 'Confirm Delete' : 'نعم، احذف',
  };

  // Product counts per category
  const productCountMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      if (p.category_id) {
        map[p.category_id] = (map[p.category_id] || 0) + 1;
      }
    }
    return map;
  }, [products]);

  const openAddModal = () => {
    setEditingCategory(null);
    setNameAr('');
    setNameFr('');
    setBrandImages([]);
    setNewBrandUrl('');
    setSortOrder((categories.length + 1) * 10);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setNameAr(cat.name);
    setNameFr(cat.name_fr || '');
    setBrandImages(cat.brand_images || []);
    setNewBrandUrl('');
    setSortOrder(cat.sort_order || 0);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingBrand(true);
    setErrorMsg('');

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadBrandImage(file);
        if (res.error) {
          setErrorMsg(res.error);
          break;
        } else if (res.url) {
          uploadedUrls.push(res.url);
        }
      }
      if (uploadedUrls.length > 0) {
        setBrandImages((prev) => [...prev, ...uploadedUrls]);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الصور');
    } finally {
      setIsUploadingBrand(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddBrandImage = () => {
    const trimmed = newBrandUrl.trim();
    if (!trimmed) return;
    if (brandImages.includes(trimmed)) {
      setErrorMsg('هذا الرابط مضاف مسبقاً');
      return;
    }
    setBrandImages([...brandImages, trimmed]);
    setNewBrandUrl('');
    setErrorMsg('');
  };

  const handleRemoveBrandImage = (idxToRemove: number) => {
    setBrandImages(brandImages.filter((_, i) => i !== idxToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) {
      setErrorMsg(language === 'fr' ? 'Veuillez saisir le nom du rayon' : 'يرجى كتابة اسم القسم');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (editingCategory) {
        const res = await updateCategory(editingCategory.id, {
          name: nameAr.trim(),
          name_fr: nameFr.trim() || null,
          sort_order: Number(sortOrder) || 0,
          brand_images: brandImages,
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(language === 'fr' ? 'Rayon modifié avec succès' : 'تم تعديل القسم واللافتة بنجاح');
          setIsModalOpen(false);
          await onRefresh();
          setTimeout(() => setSuccessMsg(''), 3000);
        }
      } else {
        const res = await createCategory({
          name: nameAr.trim(),
          name_fr: nameFr.trim() || null,
          sort_order: Number(sortOrder) || 0,
          brand_images: brandImages,
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(language === 'fr' ? 'Nouveau rayon créé avec succès' : 'تم إنشاء القسم الجديد بنجاح');
          setIsModalOpen(false);
          await onRefresh();
          setTimeout(() => setSuccessMsg(''), 3000);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalCategory) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await deleteCategory(deleteModalCategory.id);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(language === 'fr' ? 'Rayon supprimé' : 'تم حذف القسم بنجاح');
        setDeleteModalCategory(null);
        await onRefresh();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
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

      {/* Categories Grid or Empty State */}
      {categories.length === 0 ? (
        <div className="text-center py-14 px-4 bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-zinc-800/80 rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-500 dark:text-emerald-400">
            <Layers className="w-8 h-8" />
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
          {categories.map((cat, idx) => {
            const count = productCountMap[cat.id] || 0;
            const images = cat.brand_images || [];

            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:shadow-lg transition-all group flex flex-col justify-between"
              >
                <div>
                  {/* Dynamic Brand Banner Preview */}
                  <div className="mb-3.5">
                    <BrandBannerPreview images={images} alt={cat.name} />
                  </div>

                  <div className="mb-1">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                      {cat.name}
                    </h3>
                  </div>

                  {cat.name_fr && (
                    <p className="text-xs text-slate-400 dark:text-zinc-500 italic mb-2">
                      {cat.name_fr}
                    </p>
                  )}

                  {/* Brands counter badge */}
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>
                      {images.length}{' '}
                      {language === 'fr'
                        ? 'marques dans la bannière'
                        : language === 'en'
                        ? 'brands in showcase'
                        : 'ماركات في اللافتة الإشهارية'}
                    </span>
                  </div>
                </div>

                <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                    <Package className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    <span>
                      {count} {language === 'fr' ? 'produits' : language === 'en' ? 'products' : 'منتج'}
                    </span>
                  </div>

                  {/* 3-Dots Professional Actions Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuCategoryId(activeMenuCategoryId === cat.id ? null : cat.id);
                      }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                      title={language === 'fr' ? 'Actions' : 'خيارات القسم'}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuCategoryId === cat.id && (
                      <div
                        className={`absolute bottom-full mb-2 ${isRTL ? 'left-0' : 'right-0'} z-30 min-w-[145px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-1.5 shadow-2xl animate-scale-in`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuCategoryId(null);
                            openEditModal(cat);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{language === 'fr' ? 'Modifier' : language === 'en' ? 'Edit' : 'تعديل القسم'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuCategoryId(null);
                            setDeleteModalCategory(cat);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>{language === 'fr' ? 'Supprimer' : language === 'en' ? 'Delete' : 'حذف القسم'}</span>
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

      {/* Modal: Add / Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-xl bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingCategory
                    ? language === 'fr'
                      ? 'Modifier le rayon & les marques'
                      : language === 'en'
                      ? 'Edit Department & Brands'
                      : 'تعديل القسم واللافتة الإشهارية للماركات'
                    : language === 'fr'
                    ? 'Créer un nouveau rayon'
                    : language === 'en'
                    ? 'Create New Department'
                    : 'إنشاء قسم جديد ولافتة الماركات'}
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
              {/* Name (Arabic) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  {txt.nameArLabel}
                </label>
                <input
                  type="text"
                  required
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder={txt.nameArPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              {/* Name (French) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  {txt.nameFrLabel}
                </label>
                <input
                  type="text"
                  value={nameFr}
                  onChange={(e) => setNameFr(e.target.value)}
                  placeholder={txt.nameFrPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-left"
                  dir="ltr"
                />
              </div>

              {/* Brand Logos Management Section */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{txt.brandsTitle}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {txt.brandsDesc}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                    {brandImages.length}
                  </span>
                </div>

                {/* Hidden File Input for Device / Phone Upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  multiple
                  className="hidden"
                />

                {/* Primary Upload Button / Dropzone */}
                <div
                  onClick={() => !isUploadingBrand && fileInputRef.current?.click()}
                  className={`w-full py-5 px-4 rounded-2xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-emerald-500/[0.04] dark:hover:bg-emerald-500/[0.08] transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
                    isUploadingBrand ? 'opacity-70 pointer-events-none' : ''
                  }`}
                >
                  {isUploadingBrand ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                      <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {txt.uploadingBrands}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm border border-slate-200/80 dark:border-zinc-700/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {txt.uploadBrandBtn}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">
                        {txt.uploadBrandHint}
                      </span>
                    </>
                  )}
                </div>

                {/* Optional Fallback for URL link */}
                <div className="pt-1">
                  {!showUrlFallback ? (
                    <button
                      type="button"
                      onClick={() => setShowUrlFallback(true)}
                      className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>{language === 'fr' ? 'Ou ajouter par lien URL externe' : 'أو إضافة برابط خارجي (URL)'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 pt-1 animate-fade-in">
                      <input
                        type="url"
                        value={newBrandUrl}
                        onChange={(e) => setNewBrandUrl(e.target.value)}
                        placeholder={txt.addBrandPlaceholder}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-left"
                        dir="ltr"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddBrandImage();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddBrandImage}
                        disabled={!newBrandUrl.trim()}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs transition-all shrink-0 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{txt.addBrandBtn}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Brand Logos Thumbnails Grid */}
                {brandImages.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block">
                      {language === 'fr'
                        ? 'Marques ajoutées à la bannière rotative :'
                        : 'الماركات الحالية في اللافتة المتحركة:'}
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                      {brandImages.map((url, i) => (
                        <div
                          key={i}
                          className="relative h-14 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-1.5 flex items-center justify-center group/item"
                        >
                          <img
                            src={url}
                            alt={`Brand ${i + 1}`}
                            className="max-h-full max-w-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setBrandIndexToDelete(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 hover:scale-110 transition-all shadow-sm"
                            title="حذف الماركة"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Live banner preview */}
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 block mb-1.5">
                        {language === 'fr'
                          ? 'Aperçu en direct de la bannière :'
                          : 'معاينة حية لشكل اللافتة المتحركة:'}
                      </span>
                      <BrandBannerPreview images={brandImages} alt="Aperçu" />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800 mt-5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {txt.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs sm:text-sm font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? txt.save : txt.create}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deleteModalCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl animate-scale-in"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-1">
              {txt.deleteTitle}
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mb-4">
              {language === 'fr'
                ? `Êtes-vous sûr de vouloir supprimer définitivement le rayon "${deleteModalCategory.name}" ?`
                : language === 'en'
                ? `Are you sure you want to permanently delete category "${deleteModalCategory.name}"?`
                : `هل أنت متأكد من رغبتك في حذف قسم "${deleteModalCategory.name}"؟`}
            </p>

            {(productCountMap[deleteModalCategory.id] || 0) > 0 && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/40 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {language === 'fr'
                    ? `Impossible de supprimer: ce rayon contient ${productCountMap[deleteModalCategory.id]} produit(s).`
                    : language === 'en'
                    ? `Cannot delete: this category contains ${productCountMap[deleteModalCategory.id]} product(s).`
                    : `تحذير حماية: يحتوي هذا القسم على ${productCountMap[deleteModalCategory.id]} منتج(ات). يجب نقل المنتجات أولاً.`}
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-semibold mb-4">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDeleteModalCategory(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {txt.cancel}
              </button>
              <button
                type="button"
                disabled={isSubmitting || (productCountMap[deleteModalCategory.id] || 0) > 0}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold active:scale-95 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{txt.deleteConfirm}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Brand Logo */}
      {brandIndexToDelete !== null && (
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
                {language === 'fr'
                  ? 'Supprimer cette marque ?'
                  : language === 'en'
                  ? 'Remove this brand?'
                  : 'تأكيد إزالة صورة الماركة'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                {language === 'fr'
                  ? 'Cette marque ne sera plus affichée dans la bannière de ce rayon.'
                  : language === 'en'
                  ? 'This brand logo will no longer appear on the department billboard.'
                  : 'لن تظهر هذه الماركة بعد الآن في اللافتة الإشهارية لهذا القسم.'}
              </p>
            </div>

            {brandImages[brandIndexToDelete] && (
              <div className="h-16 w-24 mx-auto rounded-xl bg-slate-100 dark:bg-black border border-slate-200 dark:border-zinc-800 p-2 flex items-center justify-center">
                <img
                  src={brandImages[brandIndexToDelete]}
                  alt="Brand"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBrandIndexToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {txt.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRemoveBrandImage(brandIndexToDelete);
                  setBrandIndexToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                {language === 'fr' ? 'Oui, supprimer' : language === 'en' ? 'Yes, Remove' : 'نعم، حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

