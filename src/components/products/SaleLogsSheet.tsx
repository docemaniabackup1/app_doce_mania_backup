'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Trash2, Receipt, Calendar, X, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [couponImage, setCouponImage] = useState<string | null>(null);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');

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

  const filteredSales = useMemo(() => {
    if (!dateFilter) return sales;
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
      return saleDate === dateFilter;
    });
  }, [sales, dateFilter]);

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

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentLabel = (type?: string) => {
    if (!type) return '💵 Dinheiro';
    return paymentLabels[type] || type;
  };

  const getPaymentBadgeStyle = (type: string) => {
    const isVista = type === 'dinheiro' || type === 'pix';
    return isVista 
      ? { bg: 'bg-emerald-900/60', text: 'text-emerald-300', border: 'border-emerald-700' }
      : { bg: 'bg-amber-900/60', text: 'text-amber-300', border: 'border-amber-700' };
  };

  const showCouponImage = useCallback((sale: Sale) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lines = sale.coupon_text.split('\n');
    const lineHeight = 18;
    const padding = 20;
    const width = 300;
    const height = lines.length * lineHeight + padding * 2;

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#000000';
    ctx.font = '11px monospace';
    ctx.textBaseline = 'top';

    lines.forEach((line, index) => {
      ctx.fillText(line, padding, padding + index * lineHeight);
    });

    const imageData = canvas.toDataURL('image/png');
    setCouponImage(imageData);
  }, []);

  // Calcular total do dia filtrado
  const dailyTotal = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + sale.total_value, 0);
  }, [filteredSales]);

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
        <SheetContent side="bottom" className="h-[90vh] sm:h-[85vh] sm:max-w-lg sm:m-auto sm:rounded-lg bg-gray-800 border-gray-700 text-white">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-lg text-white">Histórico de Vendas</SheetTitle>
          </SheetHeader>
          
          {/* Filtro por data */}
          <div className="flex items-center gap-2 py-3 border-b border-gray-700">
            <Calendar className="h-4 w-4 text-gray-400" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 bg-gray-700 border-gray-600 text-white"
            />
            {dateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateFilter('')}
                className="h-9 px-2 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Total do dia */}
          {filteredSales.length > 0 && (
            <div className="flex justify-between items-center py-2 px-1 bg-gray-700/50 rounded-lg my-2">
              <span className="text-sm text-gray-400">
                {dateFilter ? 'Total filtrado' : 'Total do dia'}
              </span>
              <span className="text-lg font-bold text-green-400">
                R$ {dailyTotal.toFixed(2)}
              </span>
            </div>
          )}

          <ScrollArea className="h-[calc(100%-140px)] mt-2">
            {loading ? (
              <div className="text-center py-8 text-gray-400">
                Carregando...
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {dateFilter ? 'Nenhuma venda nesta data' : 'Nenhuma venda registrada'}
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {filteredSales.map((sale) => {
                  const badgeStyle = getPaymentBadgeStyle(sale.payment_type);
                  const isExpanded = expandedSale === sale.id;
                  
                  return (
                    <div
                      key={sale.id}
                      className="bg-gray-700/80 border border-gray-600 rounded-xl overflow-hidden shadow-lg"
                    >
                      {/* Card Principal */}
                      <div className="p-4">
                        {/* Header: Nome e Data */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-lg text-white truncate">{sale.client_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 bg-gray-600 rounded text-gray-300">
                                {formatDateShort(sale.created_at)}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatTime(sale.created_at)}
                              </span>
                            </div>
                          </div>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-900/50 shrink-0"
                              onClick={() => handleDelete(sale.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Valor e Pagamento */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-medium px-3 py-1 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                            {getPaymentLabel(sale.payment_type)}
                          </span>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-green-400">
                              R$ {sale.total_value.toFixed(2)}
                            </span>
                            <p className="text-xs text-gray-400">{sale.items_count} itens</p>
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 border-gray-600 text-gray-300 hover:bg-gray-600"
                            onClick={() => setExpandedSale(isExpanded ? null : sale.id)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Detalhes
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 border-gray-600 text-gray-300 hover:bg-gray-600 px-4"
                            onClick={() => showCouponImage(sale)}
                          >
                            <Receipt className="h-4 w-4 mr-1" />
                            Cupom
                          </Button>
                        </div>
                      </div>

                      {/* Detalhes Expandidos */}
                      {isExpanded && sale.items && (
                        <div className="border-t border-gray-600 bg-gray-800/50 p-3">
                          <p className="text-xs text-gray-400 mb-2 font-medium">ITENS DA VENDA</p>
                          <div className="space-y-1">
                            {sale.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-700/50 last:border-0">
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
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Modal de Cupom - Corrigido para responsividade */}
      {couponImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setCouponImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center">
            {/* Botão fechar no topo, fora da imagem */}
            <button
              className="mb-3 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
              onClick={() => setCouponImage(null)}
            >
              <X className="h-4 w-4" />
              Fechar
            </button>
            <img 
              src={couponImage} 
              alt="Cupom" 
              className="max-w-full max-h-[calc(90vh-60px)] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default SaleLogsSheet;
