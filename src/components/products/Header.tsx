'use client';

import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface HeaderProps {
  products: Product[];
}

const Header: React.FC<HeaderProps> = ({ products }) => {
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
    <header className="fixed top-0 left-0 right-0 z-10 p-4 bg-background text-foreground grid grid-cols-3 items-center border-b border-border">
      <div></div>
      <div className="flex items-center justify-center space-x-4">
        <div className="bg-green-500 text-black px-2 py-0.5 rounded-md text-xs font-medium text-center">
          R$ {totalOrderValue.toFixed(2)}
        </div>
        <div className="bg-green-500 text-black px-2 py-0.5 rounded-md text-xs font-medium text-center">
          {totalQuantity}
        </div>
      </div>
      <div></div>
    </header>
  );
};

export default Header;
