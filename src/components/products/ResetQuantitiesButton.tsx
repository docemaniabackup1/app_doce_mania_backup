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
      className="bg-red-600 hover:bg-red-700 text-white h-11 sm:h-10 px-3 sm:px-4"
    >
      <RotateCcw className="h-4 w-4 sm:mr-1" />
      <span className="hidden sm:inline">Zerar Quantidades</span>
    </Button>
  );
};

export default ResetQuantitiesButton;
