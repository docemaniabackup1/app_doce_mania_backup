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
}

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({
  textToCopy,
  buttonText,
  className,
  variant = "default",
}) => {
  const handleCopy = () => {
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
    <Button onClick={handleCopy} className={className} variant={variant}>
      <Copy className="mr-2 h-4 w-4" /> {buttonText}
    </Button>
  );
};

export default CopyToClipboardButton;
