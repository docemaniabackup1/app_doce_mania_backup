'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface CopyToClipboardButtonProps {
  textToCopy: string;
  buttonText: string;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
  disabled?: boolean;
}

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({
  textToCopy,
  buttonText,
  className,
  variant = "default",
  disabled = false,
}) => {
  const handleCopy = () => {
    if (disabled) {
      toast.error('Digite o nome do cliente primeiro!');
      return;
    }
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast.success('Texto copiado para a área de transferência!');
      })
      .catch((err) => {
        toast.error('Falha ao copiar o texto.');
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <Button 
      onClick={handleCopy} 
      className={className} 
      variant={variant}
      disabled={disabled}
    >
      <Copy className="h-4 w-4 sm:mr-2" /> 
      <span className="hidden sm:inline">{buttonText}</span>
      <span className="sm:hidden">Copiar</span>
    </Button>
  );
};

export default CopyToClipboardButton;
