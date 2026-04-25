import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMonthYear(month: number, year: number) {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return `${months[month - 1]} ${year}`;
}

export function formatDate(date: any, formatStr: string = 'yyyy/MM/dd HH:mm') {
  if (!date) return '';
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  try {
    return format(d, formatStr, { locale: ar });
  } catch (e) {
    return String(date);
  }
}
