'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { History, Trash2, Receipt, X, ChevronDown, ChevronUp, CheckCircle, Clock } from 'lucide-react';
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
  status?: 'pending' | 'received';
  received_at?: string | null;
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

type FilterType = 'dia' | 'semana' | 'mes' | 'total';

const SaleLogsSheet: React.FC<SaleLogsSheetProps> = ({ isAdmin }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [couponImage, setCouponImage] = useState<string | null>(null);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('dia');

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

  const handleMarkAsReceived = useCallback(async (id: string) => {
    if (!isAdmin) {
      toast.error('Apenas admin pode marcar como recebida');
      return;
    }

    try {
      const response = await fetch(`/api/sales?id=${id}`, { method: 'PUT' });
      if (response.ok) {
        setSales(prev => prev.map(sale => 
          sale.id === id 
            ? { ...sale, status: 'received' as const, received_at: new Date().toISOString() }
            : sale
        ));
        toast.success('Venda marcada como recebida!');
      }
    } catch {
      toast.error('Erro ao atualizar venda');
    }
  }, [isAdmin]);

  // Função para obter início da semana (domingo)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Função para obter início do mês
  const getMonthStart = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  };

  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    switch (filter) {
      case 'dia':
        return sales.filter(sale => {
          const saleDate = new Date(sale.created_at);
          return saleDate >= todayStart;
        });
      case 'semana':
        const weekStart = getWeekStart(now);
        return sales.filter(sale => {
          const saleDate = new Date(sale.created_at);
          return saleDate >= weekStart;
        });
      case 'mes':
        const monthStart = getMonthStart(now);
        return sales.filter(sale => {
          const saleDate = new Date(sale.created_at);
          return saleDate >= monthStart;
        });
      case 'total':
      default:
        return sales;
    }
  }, [sales, filter]);

  const getFilterLabel = () => {
    switch (filter) {
      case 'dia': return 'Hoje';
      case 'semana': return 'Esta Semana';
      case 'mes': return 'Este Mês';
      case 'total': return 'Total';
    }
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

  const isVista = (type: string) => type === 'dinheiro' || type === 'pix';

  const getPaymentBadgeStyle = (type: string, status?: string) => {
    const vista = isVista(type);
    
    if (vista) {
      return { bg: 'bg-emerald-900/60', text: 'text-emerald-300', border: 'border-emerald-700' };
    }
    
    // A prazo
    if (status === 'received') {
      return { bg: 'bg-green-900/60', text: 'text-green-300', border: 'border-green-700' };
    }
    
    return { bg: 'bg-amber-900/60', text: 'text-amber-300', border: 'border-amber-700' };
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

  // Calcular totais
  const totals = useMemo(() => {
    const total = filteredSales.reduce((sum, sale) => sum + sale.total_value, 0);
    const vista = filteredSales
      .filter(s => isVista(s.payment_type))
      .reduce((sum, sale) => sum + sale.total_value, 0);
    const prazo = filteredSales
      .filter(s => !isVista(s.payment_type))
      .reduce((sum, sale) => sum + sale.total_value, 0);
    const prazoPending = filteredSales
      .filter(s => !isVista(s.payment_type) && s.status !== 'received')
      .reduce((sum, sale) => sum + sale.total_value, 0);
    
    const count = filteredSales.length;
    const vistaCount = filteredSales.filter(s => isVista(s.payment_type)).length;
    const prazoCount = filteredSales.filter(s => !isVista(s.payment_type)).length;

    return { total, vista, prazo, prazoPending, count, vistaCount, prazoCount };
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
        <SheetContent 
          side="bottom" 
          className="h-[92vh] sm:h-[85vh] sm:max-w-lg sm:m-auto sm:rounded-lg bg-gray-800 border-gray-700 text-white z-[9999] flex flex-col"
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Header Fixo */}
          <div className="flex items-center justify-between mb-2 shrink-0">
            <SheetHeader>
              <SheetTitle className="text-lg text-white">Histórico de Vendas</SheetTitle>
            </SheetHeader>
            <SheetClose asChild>
              <button
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors z-10"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </SheetClose>
          </div>
          
          {/* Filtros Fixos */}
          <div className="flex gap-1 py-3 border-b border-gray-700 shrink-0">
            <Button
              variant={filter === 'dia' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('dia')}
              className={`flex-1 h-9 text-xs sm:text-sm ${filter === 'dia' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
            >
              Dia
            </Button>
            <Button
              variant={filter === 'semana' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('semana')}
              className={`flex-1 h-9 text-xs sm:text-sm ${filter === 'semana' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
            >
              Semana
            </Button>
            <Button
              variant={filter === 'mes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('mes')}
              className={`flex-1 h-9 text-xs sm:text-sm ${filter === 'mes' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
            >
              Mês
            </Button>
            <Button
              variant={filter === 'total' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('total')}
              className={`flex-1 h-9 text-xs sm:text-sm ${filter === 'total' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
            >
              Total
            </Button>
          </div>

          {/* Card de Totais Fixo */}
          <div className="bg-gradient-to-r from-gray-700/80 to-gray-600/60 rounded-xl p-3 my-2 border border-gray-600 shadow-lg shrink-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400 font-medium">{getFilterLabel()}</span>
              <span className="text-xs text-gray-500">{totals.count} venda{totals.count !== 1 ? 's' : ''}</span>
            </div>
            
            {/* Total Principal */}
            <div className="text-2xl font-bold text-green-400 mb-2">
              R$ {totals.total.toFixed(2)}
            </div>
            
            {/* Detalhes À Vista e A Prazo */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-800/50 rounded-lg p-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-gray-400 text-xs">À Vista</span>
                </div>
                <div className="text-emerald-300 font-semibold text-sm">
                  R$ {totals.vista.toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <span className="text-gray-400 text-xs">A Prazo</span>
                </div>
                <div className="text-amber-300 font-semibold text-sm">
                  R$ {totals.prazo.toFixed(2)}
                </div>
                {totals.prazoPending > 0 && (
                  <div className="text-orange-400 text-xs">
                    Pend: R$ {totals.prazoPending.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lista de Vendas - Área Scrollável */}
          <div className="flex-1 overflow-y-auto min-h-0 mt-2">
            {loading ? (
              <div className="text-center py-8 text-gray-400">
                Carregando...
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhuma venda encontrada
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {filteredSales.map((sale) => {
                  const badgeStyle = getPaymentBadgeStyle(sale.payment_type, sale.status);
                  const isExpanded = expandedSale === sale.id;
                  const isPrazoSale = !isVista(sale.payment_type);
                  const isPending = isPrazoSale && sale.status !== 'received';
                  
                  return (
                    <div
                      key={sale.id}
                      className={`bg-gray-700/80 border rounded-xl overflow-hidden shadow-lg ${
                        isPending ? 'border-amber-600/50' : 'border-gray-600'
                      }`}
                    >
                      {/* Card Principal */}
                      <div className="p-3">
                        {/* Header: Nome e Data */}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-base text-white truncate">{sale.client_name}</p>
                              {isPrazoSale && (
                                sale.status === 'received' ? (
                                  <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                                ) : (
                                  <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                                )
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
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
                              className="h-7 w-7 hover:bg-red-900/50 shrink-0"
                              onClick={() => handleDelete(sale.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Valor e Pagamento */}
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                            {getPaymentLabel(sale.payment_type)}
                            {isPrazoSale && (sale.status === 'received' ? ' ✓' : ' ⏳')}
                          </span>
                          <div className="text-right">
                            <span className="text-xl font-bold text-green-400">
                              R$ {sale.total_value.toFixed(2)}
                            </span>
                            <p className="text-xs text-gray-400">{sale.items_count} itens</p>
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 min-w-[80px] h-8 border-gray-600 text-gray-300 hover:bg-gray-600 text-xs"
                            onClick={() => setExpandedSale(isExpanded ? null : sale.id)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Detalhes
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-gray-600 text-gray-300 hover:bg-gray-600 px-3 text-xs"
                            onClick={() => showCouponImage(sale)}
                          >
                            <Receipt className="h-3 w-3 mr-1" />
                            Cupom
                          </Button>
                          {/* Botão de Receber - Apenas para vendas a prazo pendentes */}
                          {isAdmin && isPending && (
                            <Button
                              size="sm"
                              className="h-8 bg-green-600 hover:bg-green-700 text-white px-3 text-xs"
                              onClick={() => handleMarkAsReceived(sale.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Receber
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Detalhes Expandidos */}
                      {isExpanded && sale.items && (
                        <div className="border-t border-gray-600 bg-gray-800/50 p-2">
                          <p className="text-xs text-gray-400 mb-1 font-medium">ITENS DA VENDA</p>
                          <div className="space-y-0.5">
                            {sale.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-xs py-0.5 border-b border-gray-700/50 last:border-0">
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
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal de Cupom usando Dialog */}
      <Dialog open={!!couponImage} onOpenChange={() => setCouponImage(null)}>
        <DialogContent className="sm:max-w-sm w-[95vw] bg-gray-800 border-gray-700 text-white flex flex-col items-center z-[10001]">
          <div className="w-full flex justify-center mb-4">
            <Button
              onClick={() => setCouponImage(null)}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium flex items-center gap-2"
            >
              <X className="h-5 w-5" />
              Fechar
            </Button>
          </div>
          {couponImage && (
            <img 
              src={couponImage} 
              alt="Cupom" 
              className="max-w-full max-h-[60vh] rounded-lg shadow-2xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SaleLogsSheet;
