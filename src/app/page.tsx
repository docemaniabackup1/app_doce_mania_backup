'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/components/products/Header';
import ProductCard from '@/components/products/ProductCard';
import Footer from '@/components/products/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CopyToClipboardButton from '@/components/products/CopyToClipboardButton';
import ResetQuantitiesButton from '@/components/products/ResetQuantitiesButton';
import RegisterSaleButton from '@/components/products/RegisterSaleButton';
import { Plus, User } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '@/lib/supabase';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clientName, setClientName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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

  // Callback para mudança de admin
  const handleAdminChange = useCallback((admin: boolean) => {
    setIsAdmin(admin);
  }, []);

  // Atualizar produto
  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    setProducts(prev => 
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    );
    
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

      const updatedProduct = await response.json();
      setProducts(prev => 
        prev.map(p => p.id === id ? updatedProduct : p)
      );
    } catch (err) {
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

  // Handlers
  const handlePriceChange = useCallback((id: string, price: number) => {
    updateProduct(id, { price });
  }, [updateProduct]);

  const handleQuantityChange = useCallback((id: string, quantity: number) => {
    updateProduct(id, { quantity });
  }, [updateProduct]);

  const handleStockChange = useCallback((id: string, stock: number) => {
    updateProduct(id, { stock });
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
          stock: 100,
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
    const previousProducts = products;
    setProducts(prev => prev.filter(p => p.id !== id));

    try {
      const response = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao deletar');
      toast.success('Produto deletado!');
    } catch {
      setProducts(previousProducts);
      toast.error('Erro ao deletar produto');
    }
  }, [products]);

  const handleMove = useCallback(async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= products.length) return;

    const currentProduct = products[index];
    const targetProduct = products[newIndex];

    setProducts(prev => {
      const newProducts = [...prev];
      [newProducts[index], newProducts[newIndex]] = [newProducts[newIndex], newProducts[index]];
      return newProducts;
    });

    try {
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

  // Callback após registrar venda
  const handleSaleSuccess = useCallback(() => {
    setClientName('');
    fetchProducts();
  }, [fetchProducts]);

  // Texto do cupom
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

  // Memoizar cards
  const productCards = useMemo(() => 
    products.map((product, index) => {
      const isHidden = !isAdmin && product.stock < 1;
      
      return (
        <ProductCard
          key={product.id}
          product={product}
          isAdmin={isAdmin}
          onPriceChange={handlePriceChange}
          onQuantityChange={handleQuantityChange}
          onStockChange={handleStockChange}
          onNameChange={handleNameChange}
          onDelete={handleDeleteProduct}
          onMoveUp={() => handleMove(index, 'up')}
          onMoveDown={() => handleMove(index, 'down')}
          isFirst={index === 0}
          isLast={index === products.length - 1}
          isPending={pendingUpdates.has(product.id)}
          isHidden={isHidden}
        />
      );
    }),
    [products, isAdmin, handlePriceChange, handleQuantityChange, handleStockChange, handleNameChange, handleDeleteProduct, handleMove, pendingUpdates]
  );

  // Contar produtos visíveis
  const visibleCount = products.filter(p => isAdmin || p.stock > 0).length;

  // Calcular altura do header
  const headerHeight = isAdmin ? 'pt-[68px]' : 'pt-[52px]';

  return (
    <div className="min-h-screen bg-slate-900 overflow-x-hidden">
      <Header products={products} isAdmin={isAdmin} onAdminChange={handleAdminChange} />
      
      <main className={`w-full max-w-4xl mx-auto px-3 sm:px-4 ${headerHeight} pb-24`}>
        {/* Seção: Cliente e Ações */}
        <section className="mb-4 mt-2">
          {/* Nome do Cliente em Destaque */}
          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700/50 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <Input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value.toUpperCase())}
                  placeholder="Nome do cliente *"
                  className="h-10 text-base bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 uppercase font-semibold"
                  maxLength={50}
                />
              </div>
            </div>
            
            {/* Botões de Ação em Grid */}
            <div className="grid grid-cols-3 gap-2">
              <RegisterSaleButton
                products={products}
                clientName={clientName}
                couponText={allProductsText}
                onSuccess={handleSaleSuccess}
              />
              <CopyToClipboardButton
                textToCopy={allProductsText}
                buttonText="Copiar"
                className="h-11 bg-slate-700 hover:bg-slate-600 text-white border-slate-600 text-sm"
                variant="outline"
              />
              <ResetQuantitiesButton fetchProducts={fetchProducts} />
            </div>
          </div>
          
          {/* Cupom Preview Colapsável */}
          <details className="mt-2">
            <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 py-1.5 text-center">
              Visualizar cupom ▼
            </summary>
            <Textarea
              readOnly
              value={allProductsText}
              rows={8}
              className="mt-2 font-mono bg-slate-800 text-slate-400 border-slate-700 resize-none overflow-x-hidden text-[10px] rounded-lg"
            />
          </details>
        </section>

        {/* Botão de Adicionar Produto - Apenas Admin */}
        {isAdmin && (
          <section className="mb-4">
            <Button 
              onClick={handleAddProduct} 
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" /> Adicionar Produto
            </Button>
          </section>
        )}

        {/* Seção: Produtos */}
        <section>
          {/* Título da Seção */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Produtos</h2>
            <span className="text-xs text-slate-500">{visibleCount} disponíveis</span>
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-12">
              <div className="animate-pulse">Carregando produtos...</div>
            </div>
          ) : visibleCount === 0 ? (
            <div className="text-center text-slate-500 py-12 bg-slate-800/50 rounded-xl border border-slate-700/50">
              {isAdmin ? 'Nenhum produto cadastrado' : 'Nenhum produto disponível'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {productCards}
            </div>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
