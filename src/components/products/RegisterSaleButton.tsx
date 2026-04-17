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
  couponText: string;
  onSuccess: () => void;
}

type PaymentType = 'dinheiro' | 'pix' | '7d' | '14d' | '21d' | '30d';

const RegisterSaleButton: React.FC<RegisterSaleButtonProps> = memo(({
  products,
  clientName,
  couponText,
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
          couponText,
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
  }, [productsToSell, clientName, paymentType, couponText, onSuccess]);

  const getPaymentLabel = () => {
    const labels: Record<PaymentType, string> = {
      dinheiro: 'Dinheiro',
      pix: 'Pix',
      '7d': '7 dias',
      '14d': '14 dias',
      '21d': '21 dias',
      '30d': '30 dias',
    };
    return labels[paymentType];
  };

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        className="flex-1 text-white h-11 font-semibold"
        style={{ backgroundColor: '#1e40af' }}
        disabled={productsToSell.length === 0}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Registrar Venda
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-sm w-[95vw] bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-center text-xl">Confirmar Venda</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-5">
            {/* Cliente */}
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Cliente</p>
              <p className="text-xl font-bold text-white mt-1">{clientName}</p>
            </div>

            {/* Valor Total */}
            <div className="bg-slate-700/50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Valor Total</p>
              <p className="text-3xl font-bold text-emerald-400">R$ {totalValue.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">{totalItems} itens</p>
            </div>

            {/* Forma de Pagamento */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3 text-center">Forma de Pagamento</p>
              
              {/* À Vista */}
              <div className="mb-2">
                <p className="text-xs text-slate-500 mb-1.5">À Vista</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('dinheiro')}
                    className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      paymentType === 'dinheiro'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    💵 Dinheiro
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('pix')}
                    className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      paymentType === 'pix'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    📱 Pix
                  </button>
                </div>
              </div>

              {/* A Prazo */}
              <div>
                <p className="text-xs text-slate-500 mb-1.5">A Prazo</p>
                <div className="grid grid-cols-4 gap-2">
                  {(['7d', '14d', '21d', '30d'] as PaymentType[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setPaymentType(d)}
                      className={`py-2 px-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        paymentType === d
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                          : 'border-slate-600 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 h-12 border-slate-600 text-slate-300 hover:bg-slate-700 text-base"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmSale}
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : null}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-xs w-[90vw] text-center bg-slate-800 border-slate-700 text-white">
          <div className="py-8 flex flex-col items-center">
            <CheckCircle className="h-20 w-20 text-emerald-400 mb-4" />
            <p className="text-xl font-bold">Venda Registrada!</p>
            <p className="text-sm text-slate-400 mt-2">
              {clientName} • {getPaymentLabel()}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

RegisterSaleButton.displayName = 'RegisterSaleButton';

export default RegisterSaleButton;
