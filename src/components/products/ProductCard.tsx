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
  const [localQuantity, setLocalQuantity] = useState(product.quantity);
  const [hasChanges, setHasChanges] = useState(false);

  // Sincronizar quantidade local com a do produto quando não há mudanças pendentes
  React.useEffect(() => {
    if (!hasChanges) {
      setLocalQuantity(product.quantity);
    }
  }, [product.quantity, hasChanges]);

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
    if (localQuantity > 0) {
      const newQuantity = localQuantity - 1;
      setLocalQuantity(newQuantity);
      setHasChanges(true);
      // Debounce: só atualiza após 1 segundo sem mudanças
      setTimeout(() => {
        onQuantityChange(product.id, newQuantity);
        setHasChanges(false);
      }, 1000);
    }
  }, [localQuantity, product.id, onQuantityChange]);

  const handleIncrementQuantity = useCallback(() => {
    if (!isAdmin && localQuantity >= product.stock) {
      return;
    }
    const newQuantity = localQuantity + 1;
    setLocalQuantity(newQuantity);
    setHasChanges(true);
    setTimeout(() => {
      onQuantityChange(product.id, newQuantity);
      setHasChanges(false);
    }, 1000);
  }, [localQuantity, product.stock, isAdmin, product.id, onQuantityChange]);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPriceInput(value);
    // Normaliza o preço
    let cleanValue = value.trim();
    if (cleanValue === '') {
      onPriceChange(product.id, 0);
      return;
    }
    cleanValue = cleanValue.replace(/^0+(?=[0-9])/, '');
    cleanValue = cleanValue.replace(',', '.');
    const num = parseFloat(cleanValue);
    if (!isNaN(num)) {
      onPriceChange(product.id, num);
    }
  }, [product.id, onPriceChange]);

  const handlePriceBlur = useCallback(() => {
    setPriceInput(product.price.toString());
  }, [product.price]);

  const handleQuantityInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setLocalQuantity(0);
      onQuantityChange(product.id, 0);
    } else {
      const newQuantity = parseInt(value, 10);
      if (!isNaN(newQuantity) && newQuantity >= 0) {
        if (!isAdmin && newQuantity > product.stock) {
          setLocalQuantity(product.stock);
          onQuantityChange(product.id, product.stock);
        } else {
          setLocalQuantity(newQuantity);
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
      {isPending && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
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
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">
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

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">
            Quantidade {isAdmin && '(venda)'}
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleDecrementQuantity}
              className="h-11 w-11 sm:h-10 sm:w-10 flex items-center justify-center rounded-l-md text-lg touch-manipulation bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold transition-colors"
              style={{ backgroundColor: '#ef4444' }}
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-5 w-5" />
            </button>
            <Input
              type="number"
              value={localQuantity}
              onChange={handleQuantityInputChange}
              className="flex-1 text-center rounded-none border-x-0 h-11 sm:h-10 text-base"
              min={0}
              max={!isAdmin ? product.stock : undefined}
            />
            <button
              type="button"
              onClick={handleIncrementQuantity}
              disabled={!isAdmin && localQuantity >= product.stock}
              className="h-11 w-11 sm:h-10 sm:w-10 flex items-center justify-center rounded-r-md text-lg touch-manipulation bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#22c55e' }}
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isAdmin && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">
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

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Disponível:</span>
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
