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

      toast.success(data.message || 'Todas as quantidades foram zeradas!');
      fetchProducts();
    } catch (err) {
      toast.error('Erro ao zerar quantidades');
      console.error('Error resetting quantities:', err);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleResetQuantities} className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white">
      <RotateCcw className="h-3 w-3" />
      <span>Zerar Quantidades</span>
    </Button>
  );
};

export default ResetQuantitiesButton;
