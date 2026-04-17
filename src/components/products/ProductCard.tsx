'use client';

import React, { useState, useCallback, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Check, X, ChevronUp, ChevronDown, Loader2, Package } from 'lucide-react';

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

  const handlePriceChangeInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className={`relative rounded-xl overflow-hidden transition-all border shadow-md ${
      isOutOfStock ? 'opacity-50 border-slate-700' : 'border-slate-600/50'
    }`} style={{ backgroundColor: '#1e293b' }}>
      {isPending && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-20 rounded-xl">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        </div>
      )}

      {/* Nome do Produto */}
      <div className="px-2.5 pt-2.5 pb-2 border-b border-slate-700/30">
        {isEditingName ? (
          <div className="flex gap-1">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-xs font-semibold h-8 bg-slate-700 border-slate-600 text-white"
              autoFocus
              maxLength={100}
            />
            <Button variant="ghost" size="icon" onClick={handleSaveName} className="h-8 w-8 hover:bg-slate-700">
              <Check className="h-3 w-3 text-green-400" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-8 w-8 hover:bg-slate-700">
              <X className="h-3 w-3 text-red-400" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white truncate flex-1" title={product.name}>
              {product.name}
            </h3>
            {isAdmin && (
              <div className="flex gap-0.5 shrink-0 ml-1">
                <Button variant="ghost" size="icon" onClick={handleEditClick} className="h-6 w-6 hover:bg-slate-700 text-slate-400">
                  <Pencil className="h-2.5 w-2.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDelete} className="h-6 w-6 hover:bg-slate-700 text-slate-400">
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Preço */}
      <div className="px-2.5 pt-2">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-[10px]">R$</span>
          <Input
            type="text"
            inputMode="decimal"
            value={priceInput}
            onChange={handlePriceChangeInput}
            onBlur={handlePriceBlur}
            className="h-8 text-xs bg-slate-700/50 border-slate-600 text-white pl-7 font-medium"
            placeholder="0,00"
          />
        </div>
      </div>

      {/* Quantidade */}
      <div className="px-2.5 py-2">
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleDecrementQuantity}
            className="h-9 w-9 flex items-center justify-center rounded-l-lg text-white font-bold text-base active:scale-95 transition-transform"
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
            className="h-9 flex-1 text-center text-sm font-bold bg-slate-700/50 border-y border-slate-600 text-white focus:outline-none"
          />
          <button
            type="button"
            onClick={handleIncrementQuantity}
            disabled={!isAdmin && product.quantity >= product.stock}
            className="h-9 w-9 flex items-center justify-center rounded-r-lg text-white font-bold text-base active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#16a34a' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Admin: Estoque */}
      {isAdmin && (
        <div className="px-2.5 pb-2">
          <div className="relative">
            <Package className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <Input
              type="number"
              value={product.stock}
              onChange={handleStockChange}
              min={0}
              className="h-8 text-xs bg-slate-700/50 border-slate-600 text-white pl-7"
            />
          </div>
        </div>
      )}

      {/* Disponível */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-800/50 border-t border-slate-700/30">
        <span className="text-[9px] text-slate-500 uppercase tracking-wider">Disp.</span>
        <span className={`text-xs font-bold ${
          isOutOfStock ? 'text-red-400' : 
          isLowStock ? 'text-amber-400' : 
          'text-emerald-400'
        }`}>
          {availableStock}
        </span>
      </div>
      
      {/* Admin: Controles de Ordem */}
      {isAdmin && (
        <div className="flex border-t border-slate-700/30">
          <Button variant="ghost" size="sm" onClick={onMoveUp} disabled={isFirst} className="flex-1 h-7 rounded-none text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30">
            <ChevronUp className="h-3 w-3" />
          </Button>
          <div className="w-px bg-slate-700/50"></div>
          <Button variant="ghost" size="sm" onClick={onMoveDown} disabled={isLast} className="flex-1 h-7 rounded-none text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30">
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
