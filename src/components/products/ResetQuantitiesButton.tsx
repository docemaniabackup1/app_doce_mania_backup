'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ResetQuantitiesButtonProps {
  fetchProducts: () => void;
}

const ResetQuantitiesButton: React.FC<ResetQuantitiesButtonProps> = ({ fetchProducts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetQuantities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/products/reset', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erro ao zerar quantidades');
        return;
      }

      setIsOpen(false);
      toast.success('Quantidades zeradas!');
      fetchProducts();
    } catch {
      toast.error('Erro ao zerar quantidades');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)} 
        className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium border-amber-500"
      >
        <RotateCcw className="h-4 w-4 mr-1.5" />
        Zerar Quantidades
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[92vw] max-w-sm bg-gray-800 border-gray-700 text-white p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-white flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirmar Ação
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-gray-300 text-center mb-4 text-sm">
              Deseja zerar todas as quantidades selecionadas?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 h-11 border-gray-600 text-gray-300 hover:bg-gray-700 text-sm"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleResetQuantities}
                className="flex-1 h-11 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Zerando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ResetQuantitiesButton;
