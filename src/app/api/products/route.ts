import { NextResponse } from 'next/server';
import { supabase, Product } from '@/lib/supabase';

// GET - Buscar todos os produtos
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Tentando busca alternativa sem sort_order:', error.message);
      const { data: altData, error: altError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

      if (altError) {
        return NextResponse.json({ error: altError.message }, { status: 500 });
      }
      return NextResponse.json(altData as Product[]);
    }

    return NextResponse.json(data as Product[]);
  } catch (err) {
    console.error('Error fetching products:', err);
    return NextResponse.json({ error: 'Erro ao carregar produtos' }, { status: 500 });
  }
}

// POST - Adicionar novo produto
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, quantity, sort_order } = body;

    const { data, error } = await supabase
      .from('products')
      .insert([{ 
        name: name || 'Novo Produto', 
        price: price || 0, 
        quantity: quantity || 0, 
        sort_order: sort_order || 0 
      }])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0] as Product);
  } catch (err) {
    console.error('Error adding product:', err);
    return NextResponse.json({ error: 'Erro ao adicionar produto' }, { status: 500 });
  }
}

// PUT - Atualizar produto
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0] as Product);
  } catch (err) {
    console.error('Error updating product:', err);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

// DELETE - Deletar produto
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting product:', err);
    return NextResponse.json({ error: 'Erro ao deletar produto' }, { status: 500 });
  }
}
