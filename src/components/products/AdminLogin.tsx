'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_PIN = '2330';
const ADMIN_STORAGE_KEY = 'doce_mania_admin';

interface AdminLoginProps {
  onAdminChange: (isAdmin: boolean) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onAdminChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const savedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (savedAdmin === 'true') {
      const timer = setTimeout(() => {
        setIsAdmin(true);
        onAdminChange(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [onAdminChange]);

  const handleOpenDialog = useCallback(() => {
    if (isAdmin) {
      setIsAdmin(false);
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      onAdminChange(false);
      toast.success('Logout realizado');
    } else {
      setIsOpen(true);
      setPin('');
      setError(false);
    }
  }, [isAdmin, onAdminChange]);

  const handlePinComplete = useCallback((value: string) => {
    setPin(value);
    setError(false);
  }, []);

  const handleVerifyPin = useCallback(() => {
    if (pin === ADMIN_PIN) {
      setIsAdmin(true);
      setIsOpen(false);
      localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
      onAdminChange(true);
      toast.success('Login de admin realizado!');
      setPin('');
    } else {
      setError(true);
      toast.error('PIN incorreto!');
      setPin('');
    }
  }, [pin, onAdminChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 4) {
      handleVerifyPin();
    }
  }, [pin, handleVerifyPin]);

  return (
    <>
      <button
        onClick={handleOpenDialog}
        className={`p-2 rounded-full transition-all touch-manipulation ${
          isAdmin 
            ? 'bg-green-500 text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        }`}
        aria-label={isAdmin ? 'Logout de Admin' : 'Login de Admin'}
      >
        {isAdmin ? (
          <ShieldCheck className="h-5 w-5" />
        ) : (
          <Shield className="h-5 w-5" />
        )}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">Acesso Admin</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-muted-foreground text-center px-4">
              Digite o PIN de 4 dígitos para acessar a área administrativa
            </p>
            <InputOTP
              maxLength={4}
              value={pin}
              onChange={handlePinComplete}
              onKeyDown={handleKeyDown}
            >
              <InputOTPGroup className="gap-1">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
            {error && (
              <p className="text-sm text-red-500">PIN incorreto, tente novamente</p>
            )}
            <Button
              onClick={handleVerifyPin}
              disabled={pin.length !== 4}
              className="w-full h-11 sm:h-10"
            >
              Entrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminLogin;
