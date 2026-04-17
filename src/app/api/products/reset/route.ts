import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const securityHeaders = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store, max-age=0',
};

// POST - Zerar todas as quantidades
export async function POST() {
  try {
    // Buscar todos os IDs dos produtos
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id');

    if (fetchError) {
      console.error('[API] Error fetching products:', fetchError.message);
      return NextResponse.json(
        { error: 'Erro ao buscar produtos' },
        { status: 500, headers: securityHeaders }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: true, message: 'Não há produtos para zerar' },
        { headers: securityHeaders }
      );
    }

    // Atualizar todos os produtos
    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity: 0 })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Atualiza todos

    if (updateError) {
      console.error('[API] Error resetting quantities:', updateError.message);
      return NextResponse.json(
        { error: 'Erro ao zerar quantidades' },
        { status: 500, headers: securityHeaders }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Todas as quantidades foram zeradas!' },
      { headers: securityHeaders }
    );
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500, headers: securityHeaders }
    );
  }
}
