'use client';

import React, { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '@/lib/supabase';

interface RegisterSaleButtonProps {
  products: Product[];
  clientName: string;
  onSuccess: () => void;
}

const RegisterSaleButton: React.FC<RegisterSaleButtonProps> = memo(({
  products,
  clientName,
  onSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Filtrar produtos com quantidade > 0
  const productsToSell = products.filter(p => p.quantity > 0);
  const totalValue = productsToSell.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const totalItems = productsToSell.reduce((sum, p) => sum + p.quantity, 0);

  const handleOpenDialog = useCallback(() => {
    if (productsToSell.length === 0) {
      toast.error('Adicione produtos à venda');
      return;
    }
    setIsOpen(true);
  }, [productsToSell.length]);

  const handleConfirmSale = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: productsToSell.map(p => ({
            id: p.id,
            name: p.name,
            quantity: p.quantity,
            price: p.price,
          })),
          clientName: clientName.trim() || 'Não identificado',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar venda');
      }

      // Mostrar sucesso
      setIsOpen(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
        toast.success('Venda registrada com sucesso!');
      }, 1500);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar venda');
    } finally {
      setIsLoading(false);
    }
  }, [productsToSell, clientName, onSuccess]);

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        disabled={productsToSell.length === 0}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Registrar Venda
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Venda</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {productsToSell.map(p => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="text-muted-foreground">
                    {p.quantity}x R$ {p.price.toFixed(2)} = R$ {(p.quantity * p.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total de itens:</span>
                <span className="font-medium">{totalItems}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-green-600">R$ {totalValue.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmSale}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de sucesso */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-xs text-center">
          <div className="py-6 flex flex-col items-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-lg font-semibold">Venda Registrada!</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

RegisterSaleButton.displayName = 'RegisterSaleButton';

export default RegisterSaleButton;
