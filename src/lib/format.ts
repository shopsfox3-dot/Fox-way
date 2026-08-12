export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ar-DZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatDA(price: number): string {
  return `${formatPrice(price)} دج`;
}
