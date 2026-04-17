'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface ResetQuantitiesButtonProps {
  fetchProducts: () => void;
}

const ResetQuantitiesButton: React.FC<ResetQuantitiesButtonProps> = ({ fetchProducts }) => {
  const handleResetQuantities = async () => {
    try {
      const response = await fetch('/api/products/reset', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erro ao zerar quantidades');
        return;
      }

      toast.success('Quantidades zeradas!');
      fetchProducts();
    } catch {
      toast.error('Erro ao zerar quantidades');
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleResetQuantities} 
      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs h-9"
    >
      <RotateCcw className="h-3 w-3 mr-1" />
      Zerar
    </Button>
  );
};

export default ResetQuantitiesButton;
