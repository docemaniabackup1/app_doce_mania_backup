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
    <>
      {/* Spacer para compensar o header fixo */}
      <div className="h-[60px] sm:h-[52px]" />
      
      <header 
        className="fixed top-0 left-0 right-0 z-[9999] bg-slate-800 border-b border-slate-700 shadow-xl"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
        }}
      >
        <div className="w-full max-w-4xl mx-auto px-3 py-2">
          <div className="flex items-center justify-between h-10">
            {/* Esquerda - Hora */}
            <div className="text-sm font-medium text-slate-400 min-w-[45px]">
              {currentTime}
            </div>

            {/* Centro - Totais */}
            <div className="flex items-center justify-center gap-2">
              <div 
                className="text-white px-3 py-1.5 rounded-lg text-base font-bold shadow-sm min-w-[85px] text-center"
                style={{ backgroundColor: '#16a34a' }}
              >
                R$ {totalOrderValue.toFixed(2)}
              </div>
              <div 
                className="text-white px-3 py-1.5 rounded-lg text-base font-bold shadow-sm min-w-[45px] text-center"
                style={{ backgroundColor: '#2563eb' }}
              >
                {totalQuantity}
              </div>
            </div>

            {/* Direita - Admin e Histórico */}
            <div className="flex items-center gap-1.5 min-w-[45px] justify-end">
              <SaleLogsSheet isAdmin={isAdmin} />
              <AdminLogin onAdminChange={onAdminChange} />
            </div>
          </div>
        </div>
      </header>
      
      {/* Badge de Admin abaixo do header */}
      {isAdmin && (
        <div className="fixed top-[52px] left-0 right-0 z-[9998] flex justify-center py-1 bg-slate-800/90 border-b border-slate-700">
          <span className="bg-emerald-900/50 text-emerald-300 text-xs font-medium px-2.5 py-0.5 rounded-full border border-emerald-700">
            🔓 Modo Admin
          </span>
        </div>
      )}
    </>
  );
};

export default Header;
