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
import { Plus } from 'lucide-react';
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

  // Padding top baseado no header (admin tem badge extra)
  const headerPadding = isAdmin ? 'pt-32 sm:pt-28' : 'pt-24 sm:pt-20';

  return (
    <div className="min-h-screen bg-gray-900">
      <Header products={products} isAdmin={isAdmin} onAdminChange={handleAdminChange} />
      
      <main className={`w-full max-w-4xl mx-auto px-3 sm:px-4 pb-24 ${headerPadding}`}>
        {/* Área do Cupom */}
        <div className="mb-4 p-3 sm:p-4 border border-gray-700 rounded-lg bg-gray-800 shadow-sm">
          <div className="mb-3">
            <Label htmlFor="client-name" className="block text-sm font-medium text-gray-300 mb-1">
              Nome do Cliente *
            </Label>
            <Input
              id="client-name"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Digite o nome (obrigatório)"
              className="h-11 sm:h-10 text-base bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              maxLength={50}
            />
          </div>
          
          <Textarea
            readOnly
            value={allProductsText}
            rows={10}
            className="mb-3 font-mono bg-gray-700 text-gray-300 border-gray-600 resize-none overflow-x-hidden text-xs"
          />
          
          <div className="flex gap-2 flex-col sm:flex-row">
            <CopyToClipboardButton
              textToCopy={allProductsText}
              buttonText="Copiar Cupom"
              className="flex-1 h-11 sm:h-10"
            />
            <RegisterSaleButton
              products={products}
              clientName={clientName}
              couponText={allProductsText}
              onSuccess={handleSaleSuccess}
            />
            <ResetQuantitiesButton fetchProducts={fetchProducts} />
          </div>
        </div>

        {/* Botão de Adicionar Produto - Apenas Admin */}
        {isAdmin && (
          <div className="mb-4">
            <Button 
              onClick={handleAddProduct} 
              size="sm" 
              className="w-full bg-green-600 hover:bg-green-700 text-white h-11 sm:h-10"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar Produto
            </Button>
          </div>
        )}

        {/* Lista de Produtos */}
        {loading ? (
          <div className="text-center text-gray-400 py-8">
            Carregando produtos...
          </div>
        ) : visibleCount === 0 ? (
          <div className="text-center text-gray-400 py-8">
            {isAdmin ? 'Nenhum produto cadastrado' : 'Nenhum produto disponível'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {productCards}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
