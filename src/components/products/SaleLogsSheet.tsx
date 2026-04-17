'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Trash2, Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Sale {
  id: string;
  client_name: string;
  total_value: number;
  payment_type: string;
  coupon_text: string;
  items_count: number;
  created_at: string;
  items: SaleItem[];
}

interface SaleLogsSheetProps {
  isAdmin: boolean;
}

const paymentLabels: Record<string, string> = {
  dinheiro: '💵 Dinheiro',
  pix: '📱 Pix',
  '7d': '📅 7 dias',
  '14d': '📅 14 dias',
  '21d': '📅 21 dias',
  '30d': '📅 30 dias',
};

const SaleLogsSheet: React.FC<SaleLogsSheetProps> = ({ isAdmin }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [couponImage, setCouponImage] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sales');
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch {
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSales();
    }
  }, [isOpen, fetchSales]);

  const handleDelete = useCallback(async (id: string) => {
    if (!isAdmin) {
      toast.error('Apenas admin pode excluir');
      return;
    }

    try {
      const response = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setSales(prev => prev.filter(sale => sale.id !== id));
        toast.success('Venda excluída e estoque restaurado');
      }
    } catch {
      toast.error('Erro ao excluir');
    }
  }, [isAdmin]);

  const toggleExpanded = useCallback((saleId: string) => {
    setExpandedSale(prev => prev === saleId ? null : saleId);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentLabel = (type?: string) => {
    if (!type) return '💵 Dinheiro';
    return paymentLabels[type] || type;
  };

  const getPaymentBadge = (type: string) => {
    const isVista = type === 'dinheiro' || type === 'pix';
    return isVista 
      ? 'bg-green-900/50 text-green-400 border-green-700'
      : 'bg-orange-900/50 text-orange-400 border-orange-700';
  };

  const showCouponImage = useCallback((sale: Sale) => {
    // Gerar imagem do cupom usando canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lines = sale.coupon_text.split('\n');
    const lineHeight = 20;
    const padding = 20;
    const width = 320;
    const height = lines.length * lineHeight + padding * 2;

    canvas.width = width;
    canvas.height = height;

    // Fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Texto
    ctx.fillStyle = '#000000';
    ctx.font = '12px monospace';
    ctx.textBaseline = 'top';

    lines.forEach((line, index) => {
      ctx.fillText(line, padding, padding + index * lineHeight);
    });

    // Converter para imagem
    const imageData = canvas.toDataURL('image/png');
    setCouponImage(imageData);
  }, []);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all touch-manipulation"
            aria-label="Histórico de vendas"
          >
            <History className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] sm:h-[80vh] sm:max-w-lg sm:m-auto sm:rounded-lg bg-gray-800 border-gray-700 text-white">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-lg text-white">Histórico de Vendas</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100%-60px)] mt-2">
            {loading ? (
              <div className="text-center py-8 text-gray-400">
                Carregando...
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhuma venda registrada
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden"
                  >
                    {/* Header do Card - Sempre visível */}
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-lg text-white truncate">{sale.client_name}</p>
                          <p className="text-xs text-gray-400">
                            {formatDate(sale.created_at)}
                          </p>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-gray-600"
                            onClick={() => handleDelete(sale.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded border ${getPaymentBadge(sale.payment_type)}`}>
                            {getPaymentLabel(sale.payment_type)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {sale.items_count} itens
                          </span>
                        </div>
                        <span className="text-xl font-bold text-green-400">
                          R$ {sale.total_value.toFixed(2)}
                        </span>
                      </div>

                      {/* Botões de ação */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-9 border-gray-600 text-gray-300 hover:bg-gray-600"
                          onClick={() => toggleExpanded(sale.id)}
                        >
                          {expandedSale === sale.id ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Ocultar Itens
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Ver Itens
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 border-gray-600 text-gray-300 hover:bg-gray-600"
                          onClick={() => showCouponImage(sale)}
                        >
                          <Receipt className="h-4 w-4 mr-1" />
                          Cupom
                        </Button>
                      </div>
                    </div>

                    {/* Itens expandidos */}
                    {expandedSale === sale.id && sale.items && (
                      <div className="border-t border-gray-600 p-3 bg-gray-750">
                        <div className="space-y-2">
                          {sale.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-300 truncate flex-1">{item.product_name}</span>
                              <span className="text-gray-400 ml-2">
                                {item.quantity}x R$ {item.unit_price.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Modal de Cupom */}
      {couponImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setCouponImage(null)}
        >
          <div className="relative max-w-sm w-full">
            <img 
              src={couponImage} 
              alt="Cupom" 
              className="w-full rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              className="absolute -top-2 -right-2 rounded-full h-8 w-8 bg-gray-800 border border-gray-600"
              onClick={() => setCouponImage(null)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default SaleLogsSheet;
