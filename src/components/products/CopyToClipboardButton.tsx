'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // Tentar usar a API moderna do clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback para navegadores mais antigos ou HTTP
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('Fallback copy failed');
        }
      }
      
      setCopied(true);
      toast.success('Copiado!');
      setTimeout(() => setCopied(false), 2000);
      
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('Erro ao copiar');
    }
  };

  return (
    <Button onClick={handleCopy} className={className} variant={variant}>
      {copied ? (
        <Check className="mr-1.5 h-4 w-4 text-emerald-400" />
      ) : (
        <Copy className="mr-1.5 h-4 w-4" />
      )}
      {copied ? 'Copiado!' : buttonText}
    </Button>
  );
};

export default CopyToClipboardButton;
