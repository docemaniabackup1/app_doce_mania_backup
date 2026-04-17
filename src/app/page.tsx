'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import Header from '@/components/products/Header';
import ProductCard from '@/components/products/ProductCard';
import Footer from '@/components/products/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CopyToClipboardButton from '@/components/products/CopyToClipboardButton';
import ResetQuantitiesButton from '@/components/products/ResetQuantitiesButton';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '@/lib/supabase';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clientName, setClientName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  // Buscar produtos
  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Erro ao carregar');
      const data = await response.json();
      setProducts(data);
    } catch {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Atualizar produto com optimistic update
  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    // Optimistic update
    setProducts(prev => 
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    );
    
    // Adicionar aos pendentes
    setPendingUpdates(prev => new Set(prev).add(id));

    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      // Buscar dados atualizados do servidor
      const updatedProduct = await response.json();
      setProducts(prev => 
        prev.map(p => p.id === id ? updatedProduct : p)
      );
    } catch (err) {
      // Reverter em caso de erro
      await fetchProducts();
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar');
    } finally {
      setPendingUpdates(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [fetchProducts]);

  // Handlers otimizados
  const handlePriceChange = useCallback((id: string, price: number) => {
    updateProduct(id, { price });
  }, [updateProduct]);

  const handleQuantityChange = useCallback((id: string, quantity: number) => {
    updateProduct(id, { quantity });
  }, [updateProduct]);

  const handleNameChange = useCallback((id: string, name: string) => {
    updateProduct(id, { name });
    toast.success('Nome atualizado!');
  }, [updateProduct]);

  const handleAddProduct = useCallback(async () => {
    const maxSortOrder = products.length > 0 
      ? Math.max(...products.map(p => p.sort_order || 0)) 
      : 0;

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: 'Novo Produto', 
          price: 0, 
          quantity: 0, 
          sort_order: maxSortOrder + 1 
        }),
      });

      if (!response.ok) throw new Error('Erro ao adicionar');

      const newProduct = await response.json();
      setProducts(prev => [...prev, newProduct]);
      toast.success('Produto adicionado!');
    } catch {
      toast.error('Erro ao adicionar produto');
    }
  }, [products]);

  const handleDeleteProduct = useCallback(async (id: string) => {
    // Optimistic delete
    const previousProducts = products;
    setProducts(prev => prev.filter(p => p.id !== id));

    try {
      const response = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao deletar');
      toast.success('Produto deletado!');
    } catch {
      // Reverter em caso de erro
      setProducts(previousProducts);
      toast.error('Erro ao deletar produto');
    }
  }, [products]);

  const handleMove = useCallback(async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= products.length) return;

    const currentProduct = products[index];
    const targetProduct = products[newIndex];

    // Trocar sort_order
    setProducts(prev => {
      const newProducts = [...prev];
      [newProducts[index], newProducts[newIndex]] = [newProducts[newIndex], newProducts[index]];
      return newProducts;
    });

    try {
      // Atualizar ambos os produtos
      await Promise.all([
        fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentProduct.id, sort_order: targetProduct.sort_order }),
        }),
        fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: targetProduct.id, sort_order: currentProduct.sort_order }),
        }),
      ]);
    } catch {
      toast.error('Erro ao reordenar');
      fetchProducts();
    }
  }, [products, fetchProducts]);

  // Memoizar texto do cupom
  const allProductsText = useMemo(() => {
    const couponWidth = 32;
    const lineSeparator = "-".repeat(couponWidth);
    const starSeparator = "*".repeat(couponWidth);
    
    const centerText = (str: string) => {
      const padding = Math.max(0, couponWidth - str.length);
      const padLeft = Math.floor(padding / 2);
      return ' '.repeat(padLeft) + str + ' '.repeat(padding - padLeft);
    };

    const descColWidth = 15;
    const qtdColWidth = 5;
    const valorColWidth = 8;
    const spacing = (couponWidth - (descColWidth + qtdColWidth + valorColWidth)) / 2;

    const filteredProducts = products.filter(p => p.quantity >= 1);
    const total = filteredProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const displayClientName = clientName.trim() || "Nao identificado";

    let text = "";
    text += starSeparator + "\n";
    text += centerText("CUPOM NAO FISCAL") + "\n";
    text += starSeparator + "\n\n";
    text += `Cliente: ${displayClientName}\n`;
    text += lineSeparator + "\n";
    text += "DESCRICAO".padEnd(descColWidth) + " ".repeat(Math.floor(spacing)) + "QTD".padStart(qtdColWidth) + " ".repeat(Math.ceil(spacing)) + "VALOR".padStart(valorColWidth) + "\n";
    text += lineSeparator + "\n";

    filteredProducts.forEach(p => {
      const productName = p.name.substring(0, descColWidth).padEnd(descColWidth);
      const quantityWithX = (p.quantity + 'x').padStart(qtdColWidth);
      const unitValue = p.price.toFixed(2).padStart(valorColWidth);
      text += `${productName}${' '.repeat(Math.floor(spacing))}${quantityWithX}${' '.repeat(Math.ceil(spacing))}${unitValue}\n`;
    });

    text += lineSeparator + "\n";
    text += `TOTAL:${' '.repeat(couponWidth - 6 - 10)}R$ ${total.toFixed(2)}\n\n`;
    text += `Forma de Pagamento:${' '.repeat(couponWidth - 19 - 12)}Pix/Dinheiro\n\n`;
    text += lineSeparator + "\n";
    text += centerText("OBRIGADO PELA PREFERENCIA!") + "\n";
    text += centerText("ESCANEIE O QR CODE") + "\n";
    text += centerText("E PAGUE COM PIX") + "\n";
    text += starSeparator;

    return text;
  }, [products, clientName]);

  // Memoizar cards dos produtos
  const productCards = useMemo(() => 
    products.map((product, index) => (
      <ProductCard
        key={product.id}
        product={product}
        onPriceChange={handlePriceChange}
        onQuantityChange={handleQuantityChange}
        onNameChange={handleNameChange}
        onDelete={handleDeleteProduct}
        onMoveUp={() => handleMove(index, 'up')}
        onMoveDown={() => handleMove(index, 'down')}
        isFirst={index === 0}
        isLast={index === products.length - 1}
        isPending={pendingUpdates.has(product.id)}
      />
    )),
    [products, handlePriceChange, handleQuantityChange, handleNameChange, handleDeleteProduct, handleMove, pendingUpdates]
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header products={products} />
      <main className="container mx-auto p-4 pt-20">
        <div className="mb-6 p-4 border rounded-lg bg-card shadow-sm flex justify-center">
          <div className="w-fit max-w-full">
            <div className="mb-4">
              <Label htmlFor="client-name" className="block text-sm font-medium text-muted-foreground mb-1">
                Nome do Cliente
              </Label>
              <Input
                id="client-name"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Digite o nome do cliente"
                className="w-full"
                maxLength={50}
              />
            </div>
            <Textarea
              readOnly
              value={allProductsText}
              rows={15}
              className="mb-3 font-mono bg-muted text-muted-foreground resize-none overflow-x-hidden text-xs"
            />
            <CopyToClipboardButton
              textToCopy={allProductsText}
              buttonText="Copiar Cupom"
              className="w-full"
            />
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
          <Button onClick={handleAddProduct} size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs">
            <Plus className="h-3 w-3 mr-1" /> Adicionar Produto
          </Button>
          <ResetQuantitiesButton fetchProducts={fetchProducts} />
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Carregando produtos...</div>
        ) : products.length === 0 ? (
          <div className="text-center text-muted-foreground">Nenhum produto cadastrado</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productCards}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
