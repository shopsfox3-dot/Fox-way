import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function getCategoryIcon(iconName: string | null): LucideIcon {
  if (!iconName) return LucideIcons.Package;
  const icon = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
  return icon || LucideIcons.Package;
}
