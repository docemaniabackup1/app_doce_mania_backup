import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Headers de segurança padrão
const securityHeaders = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store, max-age=0',
};

// POST - Zerar todas as quantidades (usando única query SQL)
export async function POST() {
  try {
    // Usar RPC ou UPDATE direto para melhor performance
    const { error } = await supabase
      .rpc('reset_all_quantities')
      .catch(() => {
        // Fallback: UPDATE direto se RPC não existir
        return supabase
          .from('products')
          .update({ quantity: 0 })
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Atualiza todos
      });

    if (error) {
      console.error('[API] Error resetting quantities:', error.message);
      
      // Fallback: buscar IDs e atualizar um a um
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id');

      if (fetchError) {
        return NextResponse.json(
          { error: 'Erro ao zerar quantidades' },
          { status: 500, headers: securityHeaders }
        );
      }

      if (!products || products.length === 0) {
        return NextResponse.json(
          { success: true, message: 'Não há produtos para zerar' },
          { headers: securityHeaders }
        );
      }

      // Atualizar em lotes de 10 para não sobrecarregar
      const batchSize = 10;
      let hasError = false;

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(product =>
            supabase
              .from('products')
              .update({ quantity: 0 })
              .eq('id', product.id)
          )
        );
        
        if (results.some(r => r.error)) {
          hasError = true;
        }
      }

      if (hasError) {
        return NextResponse.json(
          { error: 'Erro ao zerar algumas quantidades' },
          { status: 500, headers: securityHeaders }
        );
      }
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
