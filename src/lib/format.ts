export function formatPrice(price: number, locale = 'ar-DZ'): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatDA(price: number, currency = 'دج'): string {
  return `${formatPrice(price)} ${currency}`;
}
