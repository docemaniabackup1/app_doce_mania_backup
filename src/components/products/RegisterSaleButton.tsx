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

type PaymentType = 'dinheiro' | 'pix' | '7d' | '14d' | '21d' | '30d';

const paymentOptions: { value: PaymentType; label: string; group: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro', group: 'À Vista' },
  { value: 'pix', label: 'Pix', group: 'À Vista' },
  { value: '7d', label: '7 dias', group: 'A Prazo' },
  { value: '14d', label: '14 dias', group: 'A Prazo' },
  { value: '21d', label: '21 dias', group: 'A Prazo' },
  { value: '30d', label: '30 dias', group: 'A Prazo' },
];

const RegisterSaleButton: React.FC<RegisterSaleButtonProps> = memo(({
  products,
  clientName,
  onSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>('dinheiro');

  const productsToSell = products.filter(p => p.quantity > 0);
  const totalValue = productsToSell.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const totalItems = productsToSell.reduce((sum, p) => sum + p.quantity, 0);

  const handleOpenDialog = useCallback(() => {
    // Validar nome do cliente
    if (!clientName.trim()) {
      toast.error('Digite o nome do cliente!');
      return;
    }
    
    if (productsToSell.length === 0) {
      toast.error('Adicione produtos à venda');
      return;
    }
    setIsOpen(true);
  }, [clientName, productsToSell.length]);

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
          clientName: clientName.trim(),
          paymentType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar venda');
      }

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
  }, [productsToSell, clientName, paymentType, onSuccess]);

  const getPaymentLabel = () => {
    const option = paymentOptions.find(o => o.value === paymentType);
    return option?.label || 'Dinheiro';
  };

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white h-11 sm:h-10"
        disabled={productsToSell.length === 0}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Registrar Venda
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Venda</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {/* Cliente */}
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Cliente:</span>
              <p className="font-semibold">{clientName}</p>
            </div>

            {/* Itens */}
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {productsToSell.map(p => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="truncate pr-2">{p.name}</span>
                  <span className="text-muted-foreground shrink-0">
                    {p.quantity}x R$ {p.price.toFixed(2)} = R$ {(p.quantity * p.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Totais */}
            <div className="border-t pt-3 space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Total de itens:</span>
                <span className="font-medium">{totalItems}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-green-600">R$ {totalValue.toFixed(2)}</span>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Forma de Pagamento</label>
              
              {/* À Vista */}
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">À Vista</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('dinheiro')}
                    className={`flex-1 py-2 px-3 rounded-md border-2 text-sm font-medium transition-all ${
                      paymentType === 'dinheiro'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    💵 Dinheiro
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('pix')}
                    className={`flex-1 py-2 px-3 rounded-md border-2 text-sm font-medium transition-all ${
                      paymentType === 'pix'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    📱 Pix
                  </button>
                </div>
              </div>

              {/* A Prazo */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">A Prazo</p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('7d')}
                    className={`py-2 px-2 rounded-md border-2 text-sm font-medium transition-all ${
                      paymentType === '7d'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    7d
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('14d')}
                    className={`py-2 px-2 rounded-md border-2 text-sm font-medium transition-all ${
                      paymentType === '14d'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    14d
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('21d')}
                    className={`py-2 px-2 rounded-md border-2 text-sm font-medium transition-all ${
                      paymentType === '21d'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    21d
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('30d')}
                    className={`py-2 px-2 rounded-md border-2 text-sm font-medium transition-all ${
                      paymentType === '30d'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    30d
                  </button>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 h-11 sm:h-10"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmSale}
                className="flex-1 bg-green-600 hover:bg-green-700 h-11 sm:h-10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Confirmar ({getPaymentLabel()})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-xs w-[90vw] text-center">
          <div className="py-6 flex flex-col items-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-lg font-semibold">Venda Registrada!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {clientName} - {getPaymentLabel()}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

RegisterSaleButton.displayName = 'RegisterSaleButton';

export default RegisterSaleButton;
