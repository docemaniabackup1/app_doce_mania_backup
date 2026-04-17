import { NextResponse } from 'next/server';
import { supabase, Product, isValidProduct } from '@/lib/supabase';

// Headers de segurança padrão
const securityHeaders = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store, max-age=0',
};

// Helper para resposta de erro
function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status, headers: securityHeaders });
}

// Helper para resposta de sucesso
function successResponse(data: unknown, status: number = 200) {
  return NextResponse.json(data, { status, headers: securityHeaders });
}

// Validação de ID UUID
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Validação de nome
function sanitizeName(name: string): string {
  return name.trim().substring(0, 100); // Limita a 100 caracteres
}

// Validação de preço
function validatePrice(price: number): number {
  return Math.max(0, Math.min(999999.99, Number(price.toFixed(2))));
}

// Validação de quantidade
function validateQuantity(quantity: number): number {
  return Math.max(0, Math.min(99999, Math.floor(quantity)));
}

// GET - Buscar todos os produtos (com cache de schema)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, quantity, sort_order, created_at')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[API] Error fetching products:', error.message);
      return errorResponse('Erro ao carregar produtos', 500);
    }

    // Validar dados antes de retornar
    const validProducts = data?.filter(isValidProduct) ?? [];
    return successResponse(validProducts);
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return errorResponse('Erro interno do servidor', 500);
  }
}

// POST - Adicionar novo produto
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validação de entrada
    const name = sanitizeName(body.name || 'Novo Produto');
    const price = validatePrice(body.price ?? 0);
    const quantity = validateQuantity(body.quantity ?? 0);
    const sort_order = Math.max(0, Math.min(99999, Number(body.sort_order) || 0));

    const { data, error } = await supabase
      .from('products')
      .insert([{ name, price, quantity, sort_order }])
      .select('id, name, price, quantity, sort_order, created_at')
      .single();

    if (error) {
      console.error('[API] Error adding product:', error.message);
      return errorResponse('Erro ao adicionar produto', 500);
    }

    return successResponse(data as Product, 201);
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return errorResponse('Erro interno do servidor', 500);
  }
}

// PUT - Atualizar produto
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    // Validação de ID
    if (!id || !isValidUUID(id)) {
      return errorResponse('ID inválido', 400);
    }

    // Sanitizar updates
    const sanitizedUpdates: Record<string, unknown> = {};
    
    if ('name' in updates) {
      sanitizedUpdates.name = sanitizeName(updates.name);
    }
    if ('price' in updates) {
      sanitizedUpdates.price = validatePrice(updates.price);
    }
    if ('quantity' in updates) {
      sanitizedUpdates.quantity = validateQuantity(updates.quantity);
    }
    if ('sort_order' in updates) {
      sanitizedUpdates.sort_order = Math.max(0, Math.min(99999, Number(updates.sort_order) || 0));
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return errorResponse('Nenhum campo válido para atualizar', 400);
    }

    const { data, error } = await supabase
      .from('products')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select('id, name, price, quantity, sort_order, created_at')
      .single();

    if (error) {
      console.error('[API] Error updating product:', error.message);
      return errorResponse('Erro ao atualizar produto', 500);
    }

    if (!data) {
      return errorResponse('Produto não encontrado', 404);
    }

    return successResponse(data as Product);
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return errorResponse('Erro interno do servidor', 500);
  }
}

// DELETE - Deletar produto
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validação de ID
    if (!id || !isValidUUID(id)) {
      return errorResponse('ID inválido', 400);
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API] Error deleting product:', error.message);
      return errorResponse('Erro ao deletar produto', 500);
    }

    return successResponse({ success: true });
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return errorResponse('Erro interno do servidor', 500);
  }
}
