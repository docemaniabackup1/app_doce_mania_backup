import { NextResponse } from 'next/server';
import { supabase, isValidSale, isValidSaleItem } from '@/lib/supabase';

const securityHeaders = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store, max-age=0',
};

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status, headers: securityHeaders });
}

function successResponse(data: unknown, status: number = 200) {
  return NextResponse.json(data, { status, headers: securityHeaders });
}

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// GET - Buscar vendas com seus itens
export async function GET() {
  try {
    // Buscar vendas
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (salesError) {
      console.error('[API] Error fetching sales:', salesError.message);
      return errorResponse('Erro ao carregar vendas', 500);
    }

    const validSales = sales?.filter(isValidSale) ?? [];
    
    // Buscar itens de todas as vendas
    const saleIds = validSales.map(s => s.id);
    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .select('*')
      .in('sale_id', saleIds);

    if (itemsError) {
      console.error('[API] Error fetching sale items:', itemsError.message);
    }

    const validItems = items?.filter(isValidSaleItem) ?? [];

    // Agrupar itens por venda
    const salesWithItems = validSales.map(sale => ({
      ...sale,
      items: validItems.filter(item => item.sale_id === sale.id)
    }));

    return successResponse(salesWithItems);
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return errorResponse('Erro interno do servidor', 500);
  }
}

// POST - Registrar uma nova venda
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, clientName, paymentType, couponText } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse('Nenhum item para registrar', 400);
    }

    if (!clientName?.trim()) {
      return errorResponse('Nome do cliente é obrigatório', 400);
    }

    // Buscar produtos atuais para verificar estoque
    const productIds = items.map((item: { id: string }) => item.id).filter(Boolean);
    
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, stock, price')
      .in('id', productIds);

    if (fetchError) {
      console.error('[API] Error fetching products:', fetchError.message);
      return errorResponse('Erro ao verificar estoque', 500);
    }

    // Verificar estoque suficiente
    const stockErrors: string[] = [];
    const productMap = new Map(products?.map(p => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.id);
      if (!product) {
        stockErrors.push(`Produto não encontrado: ${item.name}`);
        continue;
      }
      if (product.stock < item.quantity) {
        stockErrors.push(`Estoque insuficiente para ${product.name}. Disponível: ${product.stock}`);
      }
    }

    if (stockErrors.length > 0) {
      return errorResponse(stockErrors.join(' | '), 400);
    }

    // Calcular totais
    const totalValue = items.reduce((sum: number, item: { price: number; quantity: number }) => 
      sum + item.price * item.quantity, 0);
    const itemsCount = items.reduce((sum: number, item: { quantity: number }) => 
      sum + item.quantity, 0);

    // Verificar se é venda a prazo
    const isPrazo = ['7d', '14d', '21d', '30d'].includes(paymentType);
    
    // Criar a venda
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([{
        client_name: clientName.trim(),
        total_value: totalValue,
        payment_type: paymentType || 'dinheiro',
        coupon_text: couponText || '',
        items_count: itemsCount,
        status: isPrazo ? 'pending' : 'received',
        received_at: isPrazo ? null : new Date().toISOString(),
      }])
      .select()
      .single();

    if (saleError || !sale) {
      console.error('[API] Error creating sale:', saleError?.message);
      return errorResponse('Erro ao registrar venda', 500);
    }

    // Criar os itens da venda
    const saleItems = items.map((item: { id: string; name: string; quantity: number; price: number }) => ({
      sale_id: sale.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) {
      console.error('[API] Error inserting sale items:', itemsError.message);
      // Tentar deletar a venda criada
      await supabase.from('sales').delete().eq('id', sale.id);
      return errorResponse('Erro ao registrar itens da venda', 500);
    }

    // Atualizar estoque dos produtos
    for (const item of items) {
      const product = productMap.get(item.id);
      if (product) {
        await supabase
          .from('products')
          .update({ stock: product.stock - item.quantity })
          .eq('id', item.id);
      }
    }

    // Resetar quantidade de venda para 0 nos produtos vendidos
    for (const item of items) {
      await supabase
        .from('products')
        .update({ quantity: 0 })
        .eq('id', item.id);
    }

    return successResponse({ 
      success: true, 
      sale: sale,
      message: 'Venda registrada com sucesso!',
    });
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return errorResponse('Erro interno do servidor', 500);
  }
}

// PUT - Marcar venda como recebida
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !isValidUUID(id)) {
      return errorResponse('ID inválido', 400);
    }

    // Atualizar status da venda para recebida
    const { data: sale, error } = await supabase
      .from('sales')
      .update({ 
        status: 'received', 
        received_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API] Error updating sale:', error.message);
      return errorResponse('Erro ao atualizar venda', 500);
    }

    return successResponse({ success: true, sale });
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return errorResponse('Erro interno do servidor', 500);
  }
}

// DELETE - Excluir uma venda
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !isValidUUID(id)) {
      return errorResponse('ID inválido', 400);
    }

    // Buscar itens da venda para restaurar estoque
    const { data: items } = await supabase
      .from('sale_items')
      .select('product_id, quantity')
      .eq('sale_id', id);

    // Restaurar estoque
    if (items) {
      for (const item of items) {
        if (item.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();
          
          if (product) {
            await supabase
              .from('products')
              .update({ stock: product.stock + item.quantity })
              .eq('id', item.product_id);
          }
        }
      }
    }

    // Deletar itens da venda
    await supabase.from('sale_items').delete().eq('sale_id', id);

    // Deletar a venda
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API] Error deleting sale:', error.message);
      return errorResponse('Erro ao excluir venda', 500);
    }

    return successResponse({ success: true });
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return errorResponse('Erro interno do servidor', 500);
  }
}
