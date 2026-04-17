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
    <header 
      className="fixed top-0 left-0 right-0 z-[9999] bg-gray-800 border-b border-gray-700 shadow-lg"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
      }}
    >
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Esquerda - Hora */}
          <div className="text-sm sm:text-base font-medium text-gray-400 min-w-[50px] sm:min-w-[60px]">
            {currentTime}
          </div>

          {/* Centro - Totais */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <div 
              className="text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-base sm:text-lg font-bold shadow-sm min-w-[90px] text-center"
              style={{ backgroundColor: '#16a34a' }}
            >
              R$ {totalOrderValue.toFixed(2)}
            </div>
            <div 
              className="text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-base sm:text-lg font-bold shadow-sm min-w-[50px] text-center"
              style={{ backgroundColor: '#2563eb' }}
            >
              {totalQuantity}
            </div>
          </div>

          {/* Direita - Admin e Histórico */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-[50px] sm:min-w-[60px] justify-end">
            <SaleLogsSheet isAdmin={isAdmin} />
            <AdminLogin onAdminChange={onAdminChange} />
          </div>
        </div>
        
        {/* Badge de Admin Logado */}
        {isAdmin && (
          <div className="flex justify-center mt-1.5 sm:mt-2">
            <span className="bg-green-900 text-green-300 text-xs font-medium px-2 py-0.5 rounded-full">
              🔓 Modo Admin
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
