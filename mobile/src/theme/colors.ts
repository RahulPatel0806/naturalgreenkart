/** Design tokens mirrored from tailwind.config.js for use in JS (e.g. StatusBar, icons). */
export const colors = {
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#DCFCE7',
  accent: '#F97316',
  ink: '#0F172A',
  inkMuted: '#64748B',
  inkSoft: '#94A3B8',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  border: '#E2E8F0',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#16A34A',
};

export const ORDER_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: '#D97706', bg: '#FEF3C7' },
  ACCEPTED: { label: 'Accepted', color: '#2563EB', bg: '#DBEAFE' },
  PACKED: { label: 'Packed', color: '#7C3AED', bg: '#EDE9FE' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', color: '#0891B2', bg: '#CFFAFE' },
  DELIVERED: { label: 'Delivered', color: '#16A34A', bg: '#DCFCE7' },
  REJECTED: { label: 'Rejected', color: '#DC2626', bg: '#FEE2E2' },
  CANCELLED: { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2' },
};

export const formatCurrency = (amount: number): string => `₹${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
