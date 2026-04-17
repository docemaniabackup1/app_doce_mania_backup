'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Check, X, Minus, Plus, ChevronUp, ChevronDown } from 'lucide-react';

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
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPriceChange,
  onQuantityChange,
  onNameChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(product.name);

  // Memoize the initial edited name based on product.name
  const currentName = useMemo(() => {
    if (!isEditingName) {
      return product.name;
    }
    return editedName;
  }, [isEditingName, product.name, editedName]);

  const handleEditClick = () => {
    setEditedName(product.name);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    onNameChange(product.id, editedName);
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditedName(product.name);
    setIsEditingName(false);
  };

  const handleDecrementQuantity = () => {
    const newQuantity = Math.max(0, product.quantity - 1);
    onQuantityChange(product.id, newQuantity);
  };

  const handleIncrementQuantity = () => {
    const newQuantity = product.quantity + 1;
    onQuantityChange(product.id, newQuantity);
  };

  return (
    <Card className="w-full max-w-sm relative group">
      {/* Botões de Reordenação */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col space-y-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10 bg-background rounded-full border shadow-sm p-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 rounded-full" 
          onClick={onMoveUp}
          disabled={isFirst}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 rounded-full" 
          onClick={onMoveDown}
          disabled={isLast}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        {isEditingName ? (
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveName();
              }
              if (e.key === 'Escape') {
                handleCancelEdit();
              }
            }}
            className="text-lg font-semibold mr-2"
            autoFocus
          />
        ) : (
          <CardTitle className="text-lg font-semibold">{currentName}</CardTitle>
        )}
        <div className="flex space-x-1">
          {isEditingName ? (
            <>
              <Button variant="ghost" size="icon" onClick={handleSaveName}>
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="icon" onClick={handleEditClick}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)}>
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
            onChange={(e) => {
              const value = e.target.value;
              const newPrice = value === '' ? 0 : parseFloat(value);
              if (!isNaN(newPrice)) {
                onPriceChange(product.id, newPrice);
              }
            }}
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor={`quantity-${product.id}`} className="block text-sm font-medium text-muted-foreground">
            Quantidade
          </label>
          <div className="flex items-center mt-1">
            <Button variant="outline" size="icon" onClick={handleDecrementQuantity} className="h-8 w-8 rounded-r-none">
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id={`quantity-${product.id}`}
              type="number"
              value={product.quantity}
              onChange={(e) => {
                const value = e.target.value;
                const newQuantity = value === '' ? 0 : parseInt(value, 10);
                if (!isNaN(newQuantity)) {
                  onQuantityChange(product.id, newQuantity);
                }
              }}
              className="flex-1 text-center rounded-none border-x-0"
            />
            <Button variant="outline" size="icon" onClick={handleIncrementQuantity} className="h-8 w-8 rounded-l-none">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
