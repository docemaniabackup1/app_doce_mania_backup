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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalOrderValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);

  return (
    <header className="fixed top-0 left-0 right-0 z-10 p-3 bg-background text-foreground border-b border-border">
      <div className="flex items-center justify-between">
        {/* Esquerda - Hora */}
        <div className="text-sm font-medium text-muted-foreground min-w-[60px]">
          {formattedTime}
        </div>

        {/* Centro - Totais */}
        <div className="flex items-center justify-center gap-2">
          <div className="bg-green-500 text-black px-3 py-1 rounded-md text-sm font-bold">
            R$ {totalOrderValue.toFixed(2)}
          </div>
          <div className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm font-bold">
            {totalQuantity}
          </div>
        </div>

        {/* Direita - Admin e Histórico */}
        <div className="flex items-center gap-2 min-w-[60px] justify-end">
          <SaleLogsSheet isAdmin={isAdmin} />
          <AdminLogin onAdminChange={onAdminChange} />
        </div>
      </div>
      
      {/* Badge de Admin Logado */}
      {isAdmin && (
        <div className="flex justify-center mt-2">
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
            🔓 Modo Admin
          </span>
        </div>
      )}
    </header>
  );
};

export default Header;
