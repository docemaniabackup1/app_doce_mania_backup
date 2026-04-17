import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'x-application': 'doce-mania-app',
    },
  },
});

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  sort_order: number;
  created_at?: string;
}

export interface Sale {
  id: string;
  client_name: string;
  total_value: number;
  payment_type: string;
  coupon_text: string;
  items_count: number;
  created_at: string;
  status?: 'pending' | 'received';
  received_at?: string | null;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export function isValidProduct(data: unknown): data is Product {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.price === 'number' &&
    typeof obj.quantity === 'number' &&
    typeof obj.sort_order === 'number'
  );
}

export function isValidSale(data: unknown): data is Sale {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.client_name === 'string' &&
    typeof obj.total_value === 'number' &&
    typeof obj.payment_type === 'string' &&
    typeof obj.created_at === 'string'
  );
}

export function isValidSaleItem(data: unknown): data is SaleItem {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.product_name === 'string' &&
    typeof obj.quantity === 'number' &&
    typeof obj.unit_price === 'number'
  );
}
