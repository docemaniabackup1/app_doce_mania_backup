'use client';

import React, { useState, useCallback, memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Check, X, Minus, Plus, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ProductCardProps {
  product: Product;
  onPriceChange: (id: string, price: number) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onNameChange: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isPending?: boolean;
}

// Componente memoizado para evitar re-renders desnecessários
const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  onPriceChange,
  onQuantityChange,
  onNameChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isPending,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(product.name);

  // Callbacks memoizados
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
    onQuantityChange(product.id, Math.max(0, product.quantity - 1));
  }, [product.id, product.quantity, onQuantityChange]);

  const handleIncrementQuantity = useCallback(() => {
    onQuantityChange(product.id, product.quantity + 1);
  }, [product.id, product.quantity, onQuantityChange]);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onPriceChange(product.id, 0);
    } else {
      const newPrice = parseFloat(value);
      if (!isNaN(newPrice) && newPrice >= 0) {
        onPriceChange(product.id, newPrice);
      }
    }
  }, [product.id, onPriceChange]);

  const handleQuantityInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onQuantityChange(product.id, 0);
    } else {
      const newQuantity = parseInt(value, 10);
      if (!isNaN(newQuantity) && newQuantity >= 0) {
        onQuantityChange(product.id, newQuantity);
      }
    }
  }, [product.id, onQuantityChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') handleCancelEdit();
  }, [handleSaveName, handleCancelEdit]);

  const handleDelete = useCallback(() => {
    onDelete(product.id);
  }, [product.id, onDelete]);

  return (
    <Card className="w-full max-w-sm relative group">
      {/* Indicador de loading */}
      {isPending && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Botões de Reordenação */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col space-y-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10 bg-background rounded-full border shadow-sm p-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 rounded-full" 
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label="Mover para cima"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 rounded-full" 
          onClick={onMoveDown}
          disabled={isLast}
          aria-label="Mover para baixo"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        {isEditingName ? (
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-lg font-semibold mr-2"
            autoFocus
            maxLength={100}
          />
        ) : (
          <CardTitle className="text-lg font-semibold truncate" title={product.name}>
            {product.name}
          </CardTitle>
        )}
        <div className="flex space-x-1">
          {isEditingName ? (
            <>
              <Button variant="ghost" size="icon" onClick={handleSaveName} aria-label="Salvar">
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCancelEdit} aria-label="Cancelar">
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="icon" onClick={handleEditClick} aria-label="Editar nome">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Deletar produto">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`price-${product.id}`} className="block text-sm font-medium text-muted-foreground">
            Preço
          </label>
          <Input
            id={`price-${product.id}`}
            type="number"
            value={product.price}
            onChange={handlePriceChange}
            className="mt-1"
            min={0}
            step="0.01"
          />
        </div>
        <div>
          <label htmlFor={`quantity-${product.id}`} className="block text-sm font-medium text-muted-foreground">
            Quantidade
          </label>
          <div className="flex items-center mt-1">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleDecrementQuantity} 
              className="h-8 w-8 rounded-r-none"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id={`quantity-${product.id}`}
              type="number"
              value={product.quantity}
              onChange={handleQuantityInputChange}
              className="flex-1 text-center rounded-none border-x-0"
              min={0}
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleIncrementQuantity} 
              className="h-8 w-8 rounded-l-none"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
