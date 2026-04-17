'use client';

import React, { useState, useCallback, memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Check, X, Minus, Plus, ChevronUp, ChevronDown, Loader2, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface ProductCardProps {
  product: Product;
  isAdmin: boolean;
  onPriceChange: (id: string, price: number) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onStockChange: (id: string, stock: number) => void;
  onNameChange: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isPending?: boolean;
  isHidden?: boolean;
}

// Função para normalizar preço (aceita ponto e vírgula)
function normalizePrice(value: string): number {
  let cleanValue = value.trim();
  if (cleanValue === '') return 0;
  cleanValue = cleanValue.replace(/^0+(?=[0-9])/, '');
  cleanValue = cleanValue.replace(',', '.');
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('');
  }
  const num = parseFloat(cleanValue);
  return isNaN(num) ? 0 : num;
}

const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  isAdmin,
  onPriceChange,
  onQuantityChange,
  onStockChange,
  onNameChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isPending,
  isHidden,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(product.name);
  const [priceInput, setPriceInput] = useState(product.price.toString());

  const handleEditClick = useCallback(() => {
    setEditedName(product.name);
    setIsEditingName(true);
  }, [product.name]);

  const handleSaveName = useCallback(() => {
    if (editedName.trim() && editedName !== product.name) {
      onNameChange(product.id, editedName.trim());
    }
    setIsEditingName(false);
  }, [editedName, product.id, product.name, onNameChange]);

  const handleCancelEdit = useCallback(() => {
    setEditedName(product.name);
    setIsEditingName(false);
  }, [product.name]);

  const handleDecrementQuantity = useCallback(() => {
    if (product.quantity > 0) {
      onQuantityChange(product.id, product.quantity - 1);
    }
  }, [product.id, product.quantity, onQuantityChange]);

  const handleIncrementQuantity = useCallback(() => {
    if (!isAdmin && product.quantity >= product.stock) {
      return;
    }
    onQuantityChange(product.id, product.quantity + 1);
  }, [product.id, product.quantity, product.stock, isAdmin, onQuantityChange]);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPriceInput(value);
    const normalizedPrice = normalizePrice(value);
    onPriceChange(product.id, normalizedPrice);
  }, [product.id, onPriceChange]);

  const handlePriceBlur = useCallback(() => {
    setPriceInput(product.price.toString());
  }, [product.price]);

  const handleQuantityInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onQuantityChange(product.id, 0);
    } else {
      const newQuantity = parseInt(value, 10);
      if (!isNaN(newQuantity) && newQuantity >= 0) {
        if (!isAdmin && newQuantity > product.stock) {
          onQuantityChange(product.id, product.stock);
        } else {
          onQuantityChange(product.id, newQuantity);
        }
      }
    }
  }, [product.id, product.stock, isAdmin, onQuantityChange]);

  const handleStockChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onStockChange(product.id, 0);
    } else {
      const newStock = parseInt(value, 10);
      if (!isNaN(newStock) && newStock >= 0) {
        onStockChange(product.id, newStock);
      }
    }
  }, [product.id, onStockChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') handleCancelEdit();
  }, [handleSaveName, handleCancelEdit]);

  const handleDelete = useCallback(() => {
    onDelete(product.id);
  }, [product.id, onDelete]);

  const isLowStock = product.stock <= 5 && product.stock > 0;
  const isOutOfStock = product.stock === 0;

  if (isHidden) {
    return null;
  }

  return (
    <Card className={`w-full relative group touch-manipulation ${
      isOutOfStock ? 'opacity-50 border-red-300' : 
      isLowStock ? 'border-yellow-400 bg-yellow-50/50' : ''
    }`}>
      {/* Indicador de loading */}
      {isPending && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      <CardHeader className="pb-2 flex flex-row items-center justify-between px-3 sm:px-4">
        {isEditingName ? (
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-base font-semibold mr-2 h-9 sm:h-10"
            autoFocus
            maxLength={100}
          />
        ) : (
          <CardTitle className="text-base sm:text-lg font-semibold truncate pr-2" title={product.name}>
            {product.name}
          </CardTitle>
        )}
        
        {/* Botões de ação - Apenas Admin */}
        {isAdmin && (
          <div className="flex space-x-0.5 sm:space-x-1 shrink-0">
            {isEditingName ? (
              <>
                <Button variant="ghost" size="icon" onClick={handleSaveName} aria-label="Salvar" className="h-9 w-9 sm:h-10 sm:w-10">
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCancelEdit} aria-label="Cancelar" className="h-9 w-9 sm:h-10 sm:w-10">
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={handleEditClick} aria-label="Editar nome" className="h-9 w-9 sm:h-10 sm:w-10">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Deletar produto" className="h-9 w-9 sm:h-10 sm:w-10">
                  <Trash2 className="h-4 w-4" />
                </Button>
                {/* Setas de reordenação - movidas para dentro do header */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 sm:h-10 sm:w-10" 
                  onClick={onMoveUp}
                  disabled={isFirst}
                  aria-label="Mover para cima"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 sm:h-10 sm:w-10" 
                  onClick={onMoveDown}
                  disabled={isLast}
                  aria-label="Mover para baixo"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3 px-3 sm:px-4 pb-4">
        {/* Preço */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1">
            Preço
          </label>
          <Input
            type="text"
            inputMode="decimal"
            value={priceInput}
            onChange={handlePriceChange}
            onBlur={handlePriceBlur}
            className="h-11 sm:h-10 text-base"
            placeholder="0.00"
          />
        </div>

        {/* Quantidade na venda */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1">
            Quantidade {isAdmin && '(venda)'}
          </label>
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleDecrementQuantity} 
              className="h-11 w-11 sm:h-10 sm:w-10 rounded-r-none text-lg touch-manipulation bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-5 w-5" />
            </Button>
            <Input
              type="number"
              value={product.quantity}
              onChange={handleQuantityInputChange}
              className="flex-1 text-center rounded-none border-x-0 h-11 sm:h-10 text-base"
              min={0}
              max={!isAdmin ? product.stock : undefined}
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleIncrementQuantity} 
              className="h-11 w-11 sm:h-10 sm:w-10 rounded-l-none text-lg touch-manipulation bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600"
              aria-label="Aumentar quantidade"
              disabled={!isAdmin && product.quantity >= product.stock}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Estoque (apenas admin) */}
        {isAdmin && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1">
              <Package className="h-3 w-3 inline mr-1" />
              Estoque
            </label>
            <Input
              type="number"
              value={product.stock}
              onChange={handleStockChange}
              min={0}
              className="h-11 sm:h-10 text-base"
            />
          </div>
        )}

        {/* Indicador de estoque */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Disponível:</span>
          <span className={`font-medium ${
            isOutOfStock ? 'text-red-600' : 
            isLowStock ? 'text-yellow-600' : 
            'text-green-600'
          }`}>
            {product.stock} un.
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
