import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Zerar todas as quantidades
export async function POST() {
  try {
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ message: 'Não há produtos para zerar' });
    }

    const updatePromises = products.map(product =>
      supabase
        .from('products')
        .update({ quantity: 0 })
        .eq('id', product.id)
    );

    const results = await Promise.all(updatePromises);
    const hasError = results.some(result => result.error);

    if (hasError) {
      return NextResponse.json({ error: 'Erro ao zerar algumas quantidades' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Todas as quantidades foram zeradas!' });
  } catch (err) {
    console.error('Error resetting quantities:', err);
    return NextResponse.json({ error: 'Erro ao zerar quantidades' }, { status: 500 });
  }
}
