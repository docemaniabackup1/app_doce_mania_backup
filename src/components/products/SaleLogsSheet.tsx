'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Trash2, TrendingUp, Calendar, X, ChevronRight, ShoppingBag, Hash, DollarSign } from 'lucide-react';
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

type FilterPeriod = 'day' | 'week' | 'month' | 'total';

const paymentLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  '7d': '7 dias',
  '14d': '14 dias',
  '21d': '21 dias',
  '30d': '30 dias',
};

const paymentIcons: Record<string, string> = {
  dinheiro: '💵',
  pix: '📱',
  '7d': '📅',
  '14d': '📅',
  '21d': '📅',
  '30d': '📅',
};

const SaleLogsSheet: React.FC<SaleLogsSheetProps> = ({ isAdmin }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [couponImage, setCouponImage] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('day');

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
        toast.success('Venda excluída!');
      }
    } catch {
      toast.error('Erro ao excluir');
    }
  }, [isAdmin]);

  // Função para obter o início do período
  const getPeriodStart = useCallback((period: FilterPeriod): Date => {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'total':
      default:
        return new Date(2020, 0, 1);
    }
  }, []);

  // Filtrar vendas por período
  const filteredSales = useMemo(() => {
    const periodStart = getPeriodStart(filterPeriod);
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= periodStart;
    });
  }, [sales, filterPeriod, getPeriodStart]);

  // Calcular totais
  const stats = useMemo(() => {
    const totalValue = filteredSales.reduce((sum, sale) => sum + sale.total_value, 0);
    const totalSales = filteredSales.length;
    const totalItems = filteredSales.reduce((sum, sale) => sum + sale.items_count, 0);
    const averageTicket = totalSales > 0 ? totalValue / totalSales : 0;
    
    return { totalValue, totalSales, totalItems, averageTicket };
  }, [filteredSales]);

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

  const getPaymentIcon = (type?: string) => {
    if (!type) return '💵';
    return paymentIcons[type] || '💵';
  };

  const getPaymentBadgeStyle = (type: string) => {
    const isVista = type === 'dinheiro' || type === 'pix';
    return isVista 
      ? { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' }
      : { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' };
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

  const closeCouponModal = useCallback(() => {
    setCouponImage(null);
  }, []);

  // Labels dos períodos
  const periodLabels: Record<FilterPeriod, string> = {
    day: 'Dia',
    week: 'Semana',
    month: 'Mês',
    total: 'Total',
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all touch-manipulation"
            aria-label="Histórico de vendas"
          >
            <History className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[92vh] sm:h-[85vh] sm:max-w-lg sm:m-auto sm:rounded-t-2xl bg-slate-900 border-slate-700 text-white px-0">
          <SheetHeader className="px-4 pb-0">
            <SheetTitle className="text-lg text-white font-bold">Histórico de Vendas</SheetTitle>
          </SheetHeader>
          
          {/* Filtros de Período */}
          <div className="px-4 py-3">
            <div className="grid grid-cols-4 gap-1.5 bg-slate-800 p-1.5 rounded-xl">
              {(['day', 'week', 'month', 'total'] as FilterPeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setFilterPeriod(period)}
                  className={`py-2.5 px-2 rounded-lg text-sm font-semibold transition-all ${
                    filterPeriod === period
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {periodLabels[period]}
                </button>
              ))}
            </div>
          </div>

          {/* Card de Total em Destaque */}
          <div className="px-4 pb-3">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-4 shadow-xl">
              {/* Total Principal */}
              <div className="text-center pb-3 border-b border-white/20">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-emerald-100" />
                  <span className="text-xs text-emerald-100 uppercase tracking-widest font-medium">
                    Total {periodLabels[filterPeriod]}
                  </span>
                </div>
                <p className="text-4xl font-bold text-white tracking-tight">
                  R$ {stats.totalValue.toFixed(2)}
                </p>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 pt-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <ShoppingBag className="h-3.5 w-3.5 text-emerald-200" />
                    <span className="text-2xl font-bold text-white">{stats.totalSales}</span>
                  </div>
                  <p className="text-[10px] text-emerald-100 uppercase tracking-wider">Vendas</p>
                </div>
                <div className="text-center border-x border-white/20">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Hash className="h-3.5 w-3.5 text-emerald-200" />
                    <span className="text-2xl font-bold text-white">{stats.totalItems}</span>
                  </div>
                  <p className="text-[10px] text-emerald-100 uppercase tracking-wider">Itens</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-200" />
                    <span className="text-2xl font-bold text-white">{stats.averageTicket.toFixed(0)}</span>
                  </div>
                  <p className="text-[10px] text-emerald-100 uppercase tracking-wider">Média</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Vendas */}
          <ScrollArea className="h-[calc(100%-260px)] px-4">
            {loading ? (
              <div className="text-center py-8 text-slate-400">
                Carregando...
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma venda neste período</p>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {filteredSales.map((sale) => {
                  const badgeStyle = getPaymentBadgeStyle(sale.payment_type);
                  
                  return (
                    <div
                      key={sale.id}
                      className="bg-slate-800/80 border border-slate-700/50 rounded-xl overflow-hidden active:bg-slate-700/50 transition-colors"
                    >
                      <div className="p-3 flex items-center justify-between">
                        {/* Info da Venda */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-white truncate">{sale.client_name}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{formatDateShort(sale.created_at)}</span>
                            <span className="text-slate-600">•</span>
                            <span>{formatTime(sale.created_at)}</span>
                            <span className="text-slate-600">•</span>
                            <span>{sale.items_count} itens</span>
                          </div>
                        </div>
                        
                        {/* Pagamento e Valor */}
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <div className="text-right">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeStyle.bg} ${badgeStyle.text}`}>
                              {getPaymentIcon(sale.payment_type)} {sale.payment_type?.toUpperCase() || 'DINHEIRO'}
                            </span>
                            <p className="text-lg font-bold text-white mt-0.5">
                              R$ {sale.total_value.toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => showCouponImage(sale)}
                            className="p-2 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white transition-all"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(sale.id)}
                              className="p-2 rounded-lg hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Modal de Cupom */}
      {couponImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={closeCouponModal}
        >
          <button
            className="mb-4 px-6 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white font-medium hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-xl"
            onClick={(e) => {
              e.stopPropagation();
              closeCouponModal();
            }}
          >
            <X className="h-5 w-5" />
            Fechar
          </button>
          <img 
            src={couponImage} 
            alt="Cupom" 
            className="max-w-full max-h-[calc(90vh-100px)] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default SaleLogsSheet;
