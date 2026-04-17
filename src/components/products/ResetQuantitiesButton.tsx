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
        className="h-11 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium border-slate-600 rounded-xl"
      >
        <RotateCcw className="h-4 w-4 mr-1.5" />
        Zerar
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[90vw] max-w-sm bg-slate-900 border-slate-700 text-white p-4 rounded-2xl">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-white flex items-center gap-2 text-base justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Ação
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-slate-400 text-center mb-4 text-sm">
              Zerar todas as quantidades selecionadas?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 h-10 border-slate-600 text-slate-300 hover:bg-slate-800 text-sm rounded-xl"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleResetQuantities}
                className="flex-1 h-10 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl"
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
