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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Trash2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface SaleLog {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  client_name: string;
  payment_type?: string;
  created_at: string;
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
  const [logs, setLogs] = useState<SaleLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sales');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch {
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, fetchLogs]);

  const handleDelete = useCallback(async (id: string) => {
    if (!isAdmin) {
      toast.error('Apenas admin pode excluir');
      return;
    }

    try {
      const response = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setLogs(prev => prev.filter(log => log.id !== id));
        toast.success('Log excluído');
      }
    } catch {
      toast.error('Erro ao excluir');
    }
  }, [isAdmin]);

  const handleEdit = useCallback((log: SaleLog) => {
    if (!isAdmin) return;
    setEditingId(log.id);
    setEditQuantity(log.quantity);
    setEditPrice(log.unit_price);
  }, [isAdmin]);

  const handleSaveEdit = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          quantity: editQuantity,
          unit_price: editPrice,
        }),
      });

      if (response.ok) {
        setLogs(prev => prev.map(log => 
          log.id === id 
            ? { ...log, quantity: editQuantity, unit_price: editPrice, total_price: editQuantity * editPrice }
            : log
        ));
        setEditingId(null);
        toast.success('Log atualizado');
      }
    } catch {
      toast.error('Erro ao atualizar');
    }
  }, [editQuantity, editPrice]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentLabel = (type?: string) => {
    if (!type) return '💵 Dinheiro';
    return paymentLabels[type] || type;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all touch-manipulation"
          aria-label="Histórico de vendas"
        >
          <History className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] sm:h-[80vh] sm:max-w-lg sm:m-auto sm:rounded-lg">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">Histórico de Vendas</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-60px)] mt-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma venda registrada
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-card border rounded-lg p-3"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{log.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-0.5 shrink-0 ml-2">
                        {editingId === log.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleSaveEdit(log.id)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(log)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(log.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {editingId === log.id ? (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Qtd</label>
                        <Input
                          type="number"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                          className="h-9"
                          min={0}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Preço</label>
                        <Input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                          className="h-9"
                          min={0}
                          step="0.01"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {log.quantity}x R$ {log.unit_price.toFixed(2)}
                      </span>
                      <span className="font-semibold text-green-600">
                        R$ {log.total_price.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground truncate">
                      {log.client_name}
                    </p>
                    <span className="text-xs font-medium text-muted-foreground">
                      {getPaymentLabel(log.payment_type)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default SaleLogsSheet;
