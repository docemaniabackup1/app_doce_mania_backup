'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clientName, setClientName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (response.ok) {
        setProducts(data);
      } else {
        toast.error('Erro ao carregar produtos: ' + data.error);
      }
    } catch (err) {
      toast.error('Erro ao carregar produtos');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handlePriceChange = async (id: string, newPrice: number) => {
    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, price: newPrice }),
      });
      if (response.ok) {
        fetchProducts();
      } else {
        const data = await response.json();
        toast.error('Erro ao atualizar preço: ' + data.error);
      }
    } catch (err) {
      toast.error('Erro ao atualizar preço');
    }
  };

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, quantity: newQuantity }),
      });
      if (response.ok) {
        fetchProducts();
      } else {
        const data = await response.json();
        toast.error('Erro ao atualizar quantidade: ' + data.error);
      }
    } catch (err) {
      toast.error('Erro ao atualizar quantidade');
    }
  };

  const handleNameChange = async (id: string, newName: string) => {
    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: newName }),
      });
      if (response.ok) {
        fetchProducts();
        toast.success('Nome atualizado!');
      } else {
        const data = await response.json();
        toast.error('Erro ao atualizar nome: ' + data.error);
      }
    } catch (err) {
      toast.error('Erro ao atualizar nome');
    }
  };

  const handleAddProduct = async () => {
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
      if (response.ok) {
        fetchProducts();
        toast.success('Produto adicionado!');
      } else {
        const data = await response.json();
        toast.error('Erro ao adicionar produto: ' + data.error);
      }
    } catch (err) {
      toast.error('Erro ao adicionar produto');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchProducts();
        toast.success('Produto deletado!');
      } else {
        const data = await response.json();
        toast.error('Erro ao deletar produto: ' + data.error);
      }
    } catch (err) {
      toast.error('Erro ao deletar produto');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= products.length) return;

    const currentProduct = products[index];
    const targetProduct = products[newIndex];

    const sortOrders = products.map(p => p.sort_order);
    const hasDuplicates = new Set(sortOrders).size !== sortOrders.length;
    const allZeros = sortOrders.every(so => so === 0);

    if (hasDuplicates || allZeros) {
      const updates = products.map((p, i) => {
        let finalOrder = i;
        if (i === index) finalOrder = newIndex;
        else if (i === newIndex) finalOrder = index;
        
        return fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: p.id, sort_order: finalOrder }),
        });
      });
      
      try {
        await Promise.all(updates);
        fetchProducts();
      } catch (err) {
        toast.error('Erro ao organizar produtos.');
      }
      return;
    }

    try {
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentProduct.id, sort_order: targetProduct.sort_order }),
      });

      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: targetProduct.id, sort_order: currentProduct.sort_order }),
      });

      fetchProducts();
    } catch (err) {
      toast.error('Erro ao reordenar.');
    }
  };

  const generateAllProductsText = () => {
    let text = "";
    const couponWidth = 32;

    const centerText = (str: string) => {
      const padding = Math.max(0, couponWidth - str.length);
      const padLeft = Math.floor(padding / 2);
      const padRight = padding - padLeft;
      return ' '.repeat(padLeft) + str + ' '.repeat(padRight);
    };

    const lineSeparator = "-".repeat(couponWidth);
    const starSeparator = "*".repeat(couponWidth);

    text += starSeparator + "\n";
    text += centerText("CUPOM NAO FISCAL") + "\n";
    text += starSeparator + "\n\n";
    const displayClientName = clientName.trim() === '' ? "Nao identificado" : clientName.trim();
    text += `Cliente: ${displayClientName}\n`;
    text += lineSeparator + "\n";

    const descColWidth = 15;
    const qtdColWidth = 5;
    const valorColWidth = 8;
    const spacing = (couponWidth - (descColWidth + qtdColWidth + valorColWidth)) / 2;

    text += "DESCRICAO".padEnd(descColWidth) + " ".repeat(Math.floor(spacing)) + "QTD".padStart(qtdColWidth) + " ".repeat(Math.ceil(spacing)) + "VALOR".padStart(valorColWidth) + "\n";
    text += lineSeparator + "\n";

    let total = 0;
    const filteredProducts = products.filter(product => product.quantity >= 1);

    filteredProducts.forEach((product) => {
      const productName = product.name.substring(0, descColWidth).padEnd(descColWidth);
      const quantityWithX = (product.quantity + 'x').padStart(qtdColWidth);
      const unitValue = product.price.toFixed(2).padStart(valorColWidth);
      text += `${productName}${' '.repeat(Math.floor(spacing))}${quantityWithX}${' '.repeat(Math.ceil(spacing))}${unitValue}\n`;
      total += product.price * product.quantity;
    });

    text += lineSeparator + "\n";
    const totalValue = `R$ ${total.toFixed(2)}`;
    text += `TOTAL:${' '.repeat(couponWidth - 6 - totalValue.length)}${totalValue}\n\n`;
    text += `Forma de Pagamento:${' '.repeat(couponWidth - 19 - 12)}Pix/Dinheiro\n\n`;
    text += lineSeparator + "\n";
    text += centerText("OBRIGADO PELA PREFERENCIA!") + "\n";
    text += centerText("ESCANEIE O QR CODE") + "\n";
    text += centerText("E PAGUE COM PIX") + "\n";
    text += starSeparator;

    return text;
  };

  const allProductsText = generateAllProductsText();

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

        <div className="mb-6 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Button onClick={handleAddProduct} size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs">
            <Plus className="h-3 w-3 mr-1" /> Adicionar Produto
          </Button>
          <ResetQuantitiesButton fetchProducts={fetchProducts} />
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Carregando produtos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product, index) => (
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
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
