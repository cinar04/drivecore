import type { WidgetSize } from '../../types';

/**
 * 12 kolonluk grid üzerinde widget boyutlarının kapladığı alan.
 * small  -> 2 sütun (xl'de 6'da 1)
 * medium -> 6 sütun (xl'de yarım genişlik)
 * large  -> 12 sütun (tam genişlik)
 */
export function widgetSpanClass(size: WidgetSize): string {
  switch (size) {
    case 'small':  return 'col-span-2 sm:col-span-3 lg:col-span-2 xl:col-span-2';
    case 'medium': return 'col-span-6 lg:col-span-6 xl:col-span-6';
    case 'large':  return 'col-span-6 lg:col-span-12 xl:col-span-12';
    default:       return 'col-span-6';
  }
}
