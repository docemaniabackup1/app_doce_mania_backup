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
        size="sm" 
        onClick={() => setIsOpen(true)} 
        className="bg-yellow-600 hover:bg-yellow-700 text-white h-9 px-3 text-xs border-yellow-500"
      >
        <RotateCcw className="h-3 w-3 mr-1" />
        Zerar
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-sm w-[95vw] bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirmar Ação
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-300 text-center mb-4">
              Deseja zerar todas as quantidades selecionadas?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleResetQuantities}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
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
