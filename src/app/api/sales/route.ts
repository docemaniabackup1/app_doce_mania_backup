import { NextResponse } from 'next/server';
import { supabase, isValidSaleLog } from '@/lib/supabase';

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

// GET - Buscar todos os logs de vendas
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('sale_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[API] Error fetching sale logs:', error.message);
      return errorResponse('Erro ao carregar logs', 500);
    }

    const validLogs = data?.filter(isValidSaleLog) ?? [];
    return successResponse(validLogs);
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return errorResponse('Erro interno do servidor', 500);
  }
}

// POST - Registrar uma nova venda
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, clientName, paymentType } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse('Nenhum item para registrar', 400);
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

    // Preparar logs de venda
    const saleLogs = items.map((item: { id: string; name: string; quantity: number; price: number }) => ({
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      client_name: clientName || 'Não identificado',
      payment_type: paymentType || 'dinheiro',
    }));

    // Inserir logs de venda
    const { error: insertError } = await supabase
      .from('sale_logs')
      .insert(saleLogs);

    if (insertError) {
      console.error('[API] Error inserting sale logs:', insertError.message);
      return errorResponse('Erro ao registrar venda', 500);
    }

    // Atualizar estoque dos produtos
    const stockUpdates = items.map((item: { id: string; quantity: number }) => {
      const product = productMap.get(item.id);
      if (!product) return null;
      return {
        id: item.id,
        stock: product.stock - item.quantity,
      };
    }).filter(Boolean);

    // Atualizar cada produto
    for (const update of stockUpdates) {
      if (!update) continue;
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: update.stock })
        .eq('id', update.id);

      if (updateError) {
        console.error('[API] Error updating stock for product:', update.id, updateError.message);
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
      message: 'Venda registrada com sucesso!',
      totalItems: items.length,
      totalValue: items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0),
      paymentType,
    });
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return errorResponse('Erro interno do servidor', 500);
  }
}

// DELETE - Excluir um log de venda
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !isValidUUID(id)) {
      return errorResponse('ID inválido', 400);
    }

    const { error } = await supabase
      .from('sale_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API] Error deleting sale log:', error.message);
      return errorResponse('Erro ao excluir log', 500);
    }

    return successResponse({ success: true });
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return errorResponse('Erro interno do servidor', 500);
  }
}

// PUT - Editar um log de venda
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, quantity, unit_price } = body;

    if (!id || !isValidUUID(id)) {
      return errorResponse('ID inválido', 400);
    }

    const updates: Record<string, number> = {};
    
    if (typeof quantity === 'number' && quantity >= 0) {
      updates.quantity = quantity;
    }
    if (typeof unit_price === 'number' && unit_price >= 0) {
      updates.unit_price = unit_price;
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('Nenhum campo válido para atualizar', 400);
    }

    // Calcular novo total
    if (updates.quantity !== undefined || updates.unit_price !== undefined) {
      const { data: existingLog } = await supabase
        .from('sale_logs')
        .select('quantity, unit_price')
        .eq('id', id)
        .single();

      if (existingLog) {
        const qty = updates.quantity ?? existingLog.quantity;
        const price = updates.unit_price ?? existingLog.unit_price;
        updates.total_price = qty * price;
      }
    }

    const { data, error } = await supabase
      .from('sale_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API] Error updating sale log:', error.message);
      return errorResponse('Erro ao atualizar log', 500);
    }

    return successResponse(data);
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return errorResponse('Erro interno do servidor', 500);
  }
}
