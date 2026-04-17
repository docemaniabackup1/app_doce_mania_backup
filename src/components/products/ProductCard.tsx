'use client';

import React, { useState, useCallback, memo } from 'react';
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
  const [quantityInput, setQuantityInput] = useState(product.quantity.toString());

  // Sincronizar quantityInput com product.quantity
  React.useEffect(() => {
    setQuantityInput(product.quantity.toString());
  }, [product.quantity]);

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

  // Decrementar quantidade - DIRETO, SEM DELAY
  const handleDecrementQuantity = useCallback(() => {
    const newQty = Math.max(0, product.quantity - 1);
    onQuantityChange(product.id, newQty);
  }, [product.quantity, product.id, onQuantityChange]);

  // Incrementar quantidade - DIRETO, SEM DELAY
  const handleIncrementQuantity = useCallback(() => {
    if (!isAdmin && product.quantity >= product.stock) {
      return;
    }
    const newQty = product.quantity + 1;
    onQuantityChange(product.id, newQty);
  }, [product.quantity, product.stock, isAdmin, product.id, onQuantityChange]);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPriceInput(value);
    let cleanValue = value.trim();
    if (cleanValue === '') {
      onPriceChange(product.id, 0);
      return;
    }
    cleanValue = cleanValue.replace(',', '.');
    const num = parseFloat(cleanValue);
    if (!isNaN(num)) {
      onPriceChange(product.id, num);
    }
  }, [product.id, onPriceChange]);

  const handlePriceBlur = useCallback(() => {
    setPriceInput(product.price.toString());
  }, [product.price]);

  // Input de quantidade - permite digitar livremente
  const handleQuantityInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permite apenas números
    if (value === '' || /^\d+$/.test(value)) {
      setQuantityInput(value);
    }
  }, []);

  const handleQuantityBlur = useCallback(() => {
    let newQty = parseInt(quantityInput, 10);
    if (isNaN(newQty) || newQty < 0) {
      newQty = 0;
    }
    if (!isAdmin && newQty > product.stock) {
      newQty = product.stock;
    }
    onQuantityChange(product.id, newQty);
    setQuantityInput(newQty.toString());
  }, [quantityInput, product.stock, isAdmin, product.id, onQuantityChange]);

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

  // Estoque disponível = estoque - quantidade selecionada
  const availableStock = product.stock - product.quantity;
  const isLowStock = availableStock <= 5 && availableStock > 0;
  const isOutOfStock = availableStock <= 0 || product.stock === 0;

  if (isHidden) {
    return null;
  }

  return (
    <div className={`relative rounded-xl overflow-hidden transition-all ${
      isOutOfStock ? 'opacity-60' : ''
    }`} style={{ backgroundColor: '#1e293b' }}>
      {isPending && (
        <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center z-20 rounded-xl">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      )}

      {/* Header com nome */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        {isEditingName ? (
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-base font-semibold h-10 bg-gray-700 border-gray-600 text-white"
            autoFocus
            maxLength={100}
          />
        ) : (
          <h3 className="text-base font-bold text-white truncate flex-1 pr-2" title={product.name}>
            {product.name}
          </h3>
        )}
        
        {isAdmin && (
          <div className="flex gap-1 shrink-0">
            {isEditingName ? (
              <>
                <Button variant="ghost" size="icon" onClick={handleSaveName} className="h-8 w-8 hover:bg-gray-700">
                  <Check className="h-4 w-4 text-green-400" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-8 w-8 hover:bg-gray-700">
                  <X className="h-4 w-4 text-red-400" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={handleEditClick} className="h-8 w-8 hover:bg-gray-700 text-gray-400">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 hover:bg-gray-700 text-gray-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onMoveUp} disabled={isFirst} className="h-8 w-8 hover:bg-gray-700 text-gray-400">
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onMoveDown} disabled={isLast} className="h-8 w-8 hover:bg-gray-700 text-gray-400">
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Conteúdo */}
      <div className="px-4 pb-4 space-y-3">
        {/* Preço */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Preço Unitário</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">R$</span>
            <Input
              type="text"
              inputMode="decimal"
              value={priceInput}
              onChange={handlePriceChange}
              onBlur={handlePriceBlur}
              className="h-11 text-base bg-gray-700/50 border-gray-600 text-white pl-10 font-medium"
              placeholder="0,00"
            />
          </div>
        </div>

        {/* Quantidade */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Quantidade</label>
          <div className="flex items-center gap-0">
            <button
              type="button"
              onClick={handleDecrementQuantity}
              className="h-11 w-12 flex items-center justify-center rounded-l-lg text-white font-bold text-xl active:scale-95 transition-transform"
              style={{ backgroundColor: '#dc2626' }}
            >
              −
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={quantityInput}
              onChange={handleQuantityInputChange}
              onBlur={handleQuantityBlur}
              className="h-11 w-full text-center text-lg font-bold bg-gray-700/50 border-y border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ minWidth: '60px' }}
            />
            <button
              type="button"
              onClick={handleIncrementQuantity}
              disabled={!isAdmin && product.quantity >= product.stock}
              className="h-11 w-12 flex items-center justify-center rounded-r-lg text-white font-bold text-xl active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#16a34a' }}
            >
              +
            </button>
          </div>
        </div>

        {/* Admin: Estoque */}
        {isAdmin && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              <Package className="h-3 w-3 inline mr-1" />
              Estoque Total
            </label>
            <Input
              type="number"
              value={product.stock}
              onChange={handleStockChange}
              min={0}
              className="h-11 text-base bg-gray-700/50 border-gray-600 text-white"
            />
          </div>
        )}

        {/* Disponível */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-700">
          <span className="text-xs text-gray-500">Disponível</span>
          <span className={`text-sm font-bold ${
            isOutOfStock ? 'text-red-400' : 
            isLowStock ? 'text-amber-400' : 
            'text-emerald-400'
          }`}>
            {availableStock} un.
          </span>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
