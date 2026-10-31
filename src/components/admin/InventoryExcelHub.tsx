import React, { useState, useRef } from 'react';
import type { Product, Category } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { bulkUpsertProducts } from '@/lib/api';
import { formatDA } from '@/lib/format';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  Table,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';

interface InventoryExcelHubProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => Promise<void>;
  isRTL: boolean;
  language: string;
}

interface ParsedRow {
  name: string;
  categoryName: string;
  categoryId: string | null;
  price: number;
  costPrice: number | null;
  unitsPerPack: number | null;
  packPrice: number | null;
  barcode: string | null;
  isValid: boolean;
  error?: string;
}

export default function InventoryExcelHub({
  products,
  categories,
  onRefresh,
  isRTL,
  language,
}: InventoryExcelHubProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // 1. Export all current products to CSV with UTF-8 BOM for Microsoft Excel
  const handleExportProducts = () => {
    if (products.length === 0) return;

    const headers = [
      language === 'ar' ? 'اسم المنتج' : 'Nom Produit',
      language === 'ar' ? 'القسم' : 'Catégorie',
      language === 'ar' ? 'سعر الحبة (دج)' : 'Prix Unitaire (DA)',
      language === 'ar' ? 'سعر التكلفة (دج)' : 'Prix Revient (DA)',
      language === 'ar' ? 'حبات الكرتونة' : 'Pièces par Colis',
      language === 'ar' ? 'سعر الكرتونة (دج)' : 'Prix Colis (DA)',
      language === 'ar' ? 'الباركود' : 'Code Barre',
    ];

    const categoryMap = new Map<string, string>();
    categories.forEach((c) => {
      categoryMap.set(c.id, c.name);
    });

    const rows = products.map((p) => {
      const catName = categoryMap.get(p.category_id) || (language === 'ar' ? 'غير مصنف' : 'Non classé');
      const packTotalPrice = p.units_per_pack && p.pack_price ? p.units_per_pack * p.pack_price : (p.pack_price || '');
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${catName.replace(/"/g, '""')}"`,
        p.price || 0,
        p.cost_price || '',
        p.units_per_pack || '',
        packTotalPrice,
        `"${(p.barcode || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    // \uFEFF ensures Excel opens Arabic and French correctly without garbled characters
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `FoxWay_Stock_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Download a formatted Excel Template for importing new items
  const handleDownloadTemplate = () => {
    const headers = [
      language === 'ar' ? 'اسم المنتج' : 'Nom Produit',
      language === 'ar' ? 'القسم' : 'Catégorie',
      language === 'ar' ? 'سعر الحبة' : 'Prix Unitaire',
      language === 'ar' ? 'سعر التكلفة' : 'Prix Revient',
      language === 'ar' ? 'حبات الكرتونة' : 'Pièces Carton',
      language === 'ar' ? 'سعر الحبة في الكرتونة' : 'Prix Unité Carton',
      language === 'ar' ? 'الباركود' : 'Code Barre',
    ];

    const sampleCategory = categories[0]?.name || (language === 'ar' ? 'كوسميتيك وعناية شخصية' : 'Cosmétique');

    const sampleRow1 = [
      language === 'ar' ? '"شامبو صانسيلك 400 مل"' : '"Shampoing Sunsilk 400ml"',
      `"${sampleCategory}"`,
      '380',
      '310',
      '12',
      '350',
      '"613000000001"',
    ].join(',');

    const sampleRow2 = [
      language === 'ar' ? '"معجون أسنان كولجيت 75 مل"' : '"Dentifrice Colgate 75ml"',
      `"${sampleCategory}"`,
      '220',
      '175',
      '24',
      '200',
      '"613000000002"',
    ].join(',');

    const csvContent = '\uFEFF' + [headers.join(','), sampleRow1, sampleRow2].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'FoxWay_Template_Import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Handle File Upload & Parse CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setParsingError(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setParsingError(language === 'ar' ? 'الملف فارغ' : 'Le fichier est vide');
          return;
        }

        // Clean UTF-8 BOM if present
        const cleanText = text.replace(/^\uFEFF/, '');
        const lines = cleanText.split(/\r?\n/).filter((line) => line.trim().length > 0);

        if (lines.length <= 1) {
          setParsingError(
            language === 'ar'
              ? 'الملف يحتوي على ترويسة فقط ولا توجد به بيانات منتجات.'
              : 'Le fichier ne contient que des en-têtes sans lignes de produits.'
          );
          return;
        }

        // Determine delimiter (comma or semicolon)
        const firstLine = lines[0];
        const delimiter = firstLine.includes(';') ? ';' : ',';

        // Helper to split line with quotes
        const parseCSVLine = (lineStr: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < lineStr.length; i++) {
            const char = lineStr[i];
            if (char === '"') {
              if (inQuotes && lineStr[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === delimiter && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const rows: ParsedRow[] = [];
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length < 3) continue;

          const name = cols[0]?.replace(/^"|"$/g, '').trim() || '';
          const categoryName = cols[1]?.replace(/^"|"$/g, '').trim() || '';
          const priceRaw = parseFloat(cols[2]?.replace(/[^0-9.]/g, '') || '0');
          const costPriceRaw = cols[3] ? parseFloat(cols[3].replace(/[^0-9.]/g, '') || '0') : null;
          const unitsPerPackRaw = cols[4] ? parseInt(cols[4].replace(/[^0-9]/g, '') || '0', 10) : null;
          const packPriceRaw = cols[5] ? parseFloat(cols[5].replace(/[^0-9.]/g, '') || '0') : null;
          const barcode = cols[6]?.replace(/^"|"$/g, '').trim() || null;

          // Find matching category ID
          const matchedCategory = categories.find(
            (c) =>
              c.name.trim().toLowerCase() === categoryName.toLowerCase() ||
              (c.name_fr && c.name_fr.trim().toLowerCase() === categoryName.toLowerCase())
          );

          const isValid = !!name && priceRaw > 0 && !!matchedCategory;
          let error = '';
          if (!name) error = language === 'ar' ? 'اسم المنتج ناقص' : 'Nom manquant';
          else if (priceRaw <= 0) error = language === 'ar' ? 'السعر غير صحيح' : 'Prix invalide';
          else if (!matchedCategory) {
            error =
              language === 'ar'
                ? `القسم (${categoryName}) غير موجود بالنظام`
                : `Rayon (${categoryName}) introuvable`;
          }

          rows.push({
            name,
            categoryName,
            categoryId: matchedCategory ? matchedCategory.id : categories[0]?.id || null,
            price: priceRaw,
            costPrice: costPriceRaw,
            unitsPerPack: unitsPerPackRaw && unitsPerPackRaw > 0 ? unitsPerPackRaw : null,
            packPrice: packPriceRaw && packPriceRaw > 0 ? packPriceRaw : null,
            barcode,
            isValid,
            error: error || undefined,
          });
        }

        if (rows.length === 0) {
          setParsingError(language === 'ar' ? 'لم يتم العثور على أسطر صالحة' : 'Aucune ligne valide trouvée');
          return;
        }

        setParsedRows(rows);
      } catch (err) {
        console.error('Error parsing CSV:', err);
        setParsingError(language === 'ar' ? 'تعذر قراءة الملف، تأكد من الصيغة' : 'Erreur de lecture du fichier CSV');
      }
    };
    reader.readAsText(file);
  };

  // 4. Confirm and Import to Database
  const handleCommitImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid && r.categoryId);
    if (validRows.length === 0) return;

    setIsImporting(true);
    setParsingError(null);

    const payload = validRows.map((r) => ({
      category_id: r.categoryId!,
      name: r.name,
      price: r.price,
      cost_price: r.costPrice,
      unit: 'حبة',
      units_per_pack: r.unitsPerPack,
      pack_label: r.unitsPerPack ? 'كرتونة' : null,
      pack_price: r.packPrice,
      barcode: r.barcode,
      stock: 100,
    }));

    const result = await bulkUpsertProducts(payload);
    setIsImporting(false);

    if (result.error) {
      setParsingError(result.error);
    } else {
      setImportSuccess(
        language === 'ar'
          ? `تم بنجاح استيراد وإضافة ${result.count} منتج إلى قائمة المخزون!`
          : `${result.count} produits importés avec succès dans le catalogue !`
      );
      setParsedRows([]);
      setSelectedFile(null);
      await onRefresh();
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600/15 via-teal-600/10 to-transparent p-5 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-sm">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{language === 'ar' ? 'مركز استيراد وتصدير المخزون (Excel / CSV)' : 'Import / Export Excel du Stock'}</span>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                UTF-8 BOM
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-0.5">
              {language === 'ar'
                ? 'ارفع مئات السلع دفعة واحدة بملف إكسل واحد، أو صدّر الجرد الكامل مع تكلفة الشراء وهوامش الربح.'
                : 'Importez en masse vos articles ou exportez l’inventaire complet en quelques clics.'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold border border-slate-200 dark:border-zinc-700 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>{language === 'ar' ? 'تحميل قالب الإكسل النموذجي' : 'Modèle Excel'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportProducts}
            disabled={products.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white text-xs font-extrabold transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{language === 'ar' ? `تصدير المخزون الحالي (${products.length})` : `Exporter le stock (${products.length})`}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {importSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 rounded-2xl text-xs sm:text-sm flex items-center gap-3 shadow-sm animate-fade-in-up">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-extrabold">{importSuccess}</span>
        </div>
      )}

      {/* Error Notification */}
      {parsingError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-400 rounded-2xl text-xs sm:text-sm flex items-center gap-3 shadow-sm animate-fade-in-up">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-bold">{parsingError}</span>
        </div>
      )}

      {/* Upload Drop Zone */}
      <div className="bg-white dark:bg-[#121215] rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,application/vnd.ms-excel"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500/60 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-zinc-900/40 hover:bg-emerald-500/5 group"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
            {selectedFile
              ? selectedFile.name
              : language === 'ar'
              ? 'انقر هنا لاختيار ملف إكسل أو CSV من جهازك'
              : 'Cliquez pour sélectionner votre fichier CSV / Excel'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            {language === 'ar'
              ? 'يدعم الملفات الصادرة من برامج المحاسبة وإكسل. يجب أن يتطابق اسم القسم مع الأقسام المسجلة لديك.'
              : 'Compatible avec les exports Excel et logiciels de gestion commerciale.'}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
            <span className="bg-slate-200 dark:bg-zinc-800 px-2.5 py-1 rounded-md font-mono">.CSV (UTF-8)</span>
            <span className="bg-slate-200 dark:bg-zinc-800 px-2.5 py-1 rounded-md font-mono">Excel Compatible</span>
          </div>
        </div>

        {/* Preview of Parsed Rows */}
        {parsedRows.length > 0 && (
          <div className="mt-6 space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-500" />
                  <span>
                    {language === 'ar' ? 'معاينة المنتجات المستخرجة قبل التأكيد:' : 'Aperçu avant importation :'}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                    ({parsedRows.length} {language === 'ar' ? 'منتج' : 'articles'})
                  </span>
                </h4>
                <div className="flex items-center gap-3 text-xs mt-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{validCount} {language === 'ar' ? 'جاهز للاستيراد' : 'valides'}</span>
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-rose-500 font-bold flex items-center gap-1">
                      <X className="w-3.5 h-3.5" />
                      <span>{invalidCount} {language === 'ar' ? 'يحتوي على أخطاء' : 'invalides'}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setSelectedFile(null);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>

                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={isImporting || validCount === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-sm shadow-emerald-500/20 disabled:opacity-50 transition-all"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    {language === 'ar'
                      ? `تأكيد واستيراد ${validCount} منتج إلى المتجر`
                      : `Confirmer l’importation (${validCount})`}
                  </span>
                </button>
              </div>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-2xl max-h-96 overflow-y-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-100 dark:bg-zinc-900/90 text-slate-700 dark:text-zinc-300 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="p-3 text-start">#</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'اسم المنتج' : 'Produit'}</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'القسم' : 'Rayon'}</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'سعر الحبة' : 'Prix Unité'}</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'سعر التكلفة' : 'Coût'}</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'الكرتونة' : 'Colis'}</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'الباركود' : 'Code Barre'}</th>
                    <th className="p-3 text-center">{language === 'ar' ? 'الحالة' : 'État'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/80 bg-white dark:bg-[#121215]">
                  {parsedRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={row.isValid ? 'hover:bg-slate-50 dark:hover:bg-zinc-900/50' : 'bg-rose-50/50 dark:bg-rose-950/20'}
                    >
                      <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                        {row.name}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-zinc-300">
                        {row.categoryName}
                      </td>
                      <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatDA(row.price)}
                      </td>
                      <td className="p-3 text-slate-500 dark:text-zinc-400">
                        {row.costPrice ? formatDA(row.costPrice) : '-'}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-zinc-300">
                        {row.unitsPerPack ? (
                          <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[11px] font-bold">
                            {row.unitsPerPack} حبة {row.packPrice ? `(${formatDA(row.packPrice)}/حبة)` : ''}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-500 dark:text-zinc-400">
                        {row.barcode || '-'}
                      </td>
                      <td className="p-3 text-center">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Check className="w-3 h-3" />
                            <span>{language === 'ar' ? 'صالح' : 'Valide'}</span>
                          </span>
                        ) : (
                          <span
                            title={row.error}
                            className="inline-flex items-center gap-1 text-rose-500 font-bold text-[11px] bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 cursor-help"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>{row.error}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Instructions Card */}
      <div className="bg-slate-50 dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 flex items-start gap-3 text-xs text-slate-600 dark:text-zinc-400">
        <HelpCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900 dark:text-white">
            {language === 'ar' ? 'إرشادات استيراد ملفات الإكسل وسوق الجملة:' : 'Conseils pour l’importation :'}
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-zinc-400">
            <li>
              {language === 'ar'
                ? 'استخدم دائماً زر "تحميل قالب الإكسل النموذجي" للحصول على الأعمدة مرتبة بشكل صحيح.'
                : 'Téléchargez le modèle type pour respecter l’ordre exact des colonnes.'}
            </li>
            <li>
              {language === 'ar'
                ? 'تأكد من أن اسم القسم في الملف يطابق تماماً اسم أحد الأقسام المنشأة في متجرك.'
                : 'Le nom du rayon doit correspondre aux catégories créées dans la plateforme.'}
            </li>
            <li>
              {language === 'ar'
                ? 'سعر التكلفة يبقى سرياً تماماً ولا يظهر لأصحاب المحلات أو السائقين، ويُستخدم فقط لحساب أرباحك الصافية.'
                : 'Le prix de revient reste strictement confidentiel pour calculer vos marges bénéficiaires.'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
