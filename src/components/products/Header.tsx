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
      <header 
        className="fixed top-0 left-0 right-0 z-[9999] bg-slate-800 border-b border-slate-700 shadow-xl safe-area-top"
      >
        <div className="w-full max-w-4xl mx-auto px-2 sm:px-3 py-2">
          <div className="flex items-center justify-between h-10">
            {/* Esquerda - Hora */}
            <div className="text-sm font-medium text-slate-400 min-w-[40px]">
              {currentTime}
            </div>

            {/* Centro - Totais */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <div 
                className="text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-sm sm:text-base font-bold shadow-sm min-w-[75px] sm:min-w-[85px] text-center"
                style={{ backgroundColor: '#16a34a' }}
              >
                R$ {totalOrderValue.toFixed(2)}
              </div>
              <div 
                className="text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-sm sm:text-base font-bold shadow-sm min-w-[40px] sm:min-w-[45px] text-center"
                style={{ backgroundColor: '#2563eb' }}
              >
                {totalQuantity}
              </div>
            </div>

            {/* Direita - Admin e Histórico */}
            <div className="flex items-center gap-1 min-w-[40px] justify-end">
              <SaleLogsSheet isAdmin={isAdmin} />
              <AdminLogin onAdminChange={onAdminChange} />
            </div>
          </div>
        </div>
        
        {/* Badge de Admin dentro do header */}
        {isAdmin && (
          <div className="flex justify-center pb-1.5 pt-0.5 border-t border-slate-700/50">
            <span className="bg-emerald-900/50 text-emerald-300 text-xs font-medium px-2.5 py-0.5 rounded-full border border-emerald-700">
              🔓 Admin
            </span>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
