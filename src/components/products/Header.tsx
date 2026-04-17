'use client';

import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import SaleLogsSheet from './SaleLogsSheet';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface HeaderProps {
  products: Product[];
  isAdmin: boolean;
  onAdminChange: (isAdmin: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ products, isAdmin, onAdminChange }) => {
  const [currentTime, setCurrentTime] = useState<string>('--:--');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalOrderValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] bg-slate-900 border-b border-slate-700/80 shadow-lg">
      {/* Linha Principal */}
      <div className="w-full max-w-4xl mx-auto px-3 py-2">
        <div className="flex items-center justify-between">
          {/* Esquerda - Hora */}
          <div className="flex items-center gap-2 min-w-[60px]">
            <span className="text-sm font-medium text-slate-500">{currentTime}</span>
          </div>

          {/* Centro - Logo e Totais */}
          <div className="flex items-center gap-3">
            {/* Quantidade */}
            <div className="flex items-center gap-1.5 bg-blue-600/20 px-2.5 py-1 rounded-lg">
              <span className="text-xs text-blue-300 font-medium">Itens</span>
              <span className="text-base font-bold text-blue-400">{totalQuantity}</span>
            </div>
            
            {/* Total em Destaque */}
            <div className="bg-emerald-500 px-4 py-1.5 rounded-lg shadow-lg">
              <span className="text-base font-bold text-white">R$ {totalOrderValue.toFixed(2)}</span>
            </div>
          </div>

          {/* Direita - Ações */}
          <div className="flex items-center gap-1.5 min-w-[60px] justify-end">
            <SaleLogsSheet isAdmin={isAdmin} />
            <AdminLogin onAdminChange={onAdminChange} />
          </div>
        </div>
      </div>
      
      {/* Badge de Admin */}
      {isAdmin && (
        <div className="bg-emerald-900/40 border-t border-emerald-800/50 py-1 px-3">
          <div className="w-full max-w-4xl mx-auto flex justify-center">
            <span className="text-xs font-medium text-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Modo Administrador
            </span>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
