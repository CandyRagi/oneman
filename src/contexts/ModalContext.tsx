"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isAnyModalOpen: boolean;
  setIsAnyModalOpen: (isOpen: boolean) => void;
  pendingSelection: {
    type: 'source' | 'destination' | null;
    modalType: 'add' | 'remove' | null;
    groupId: string | null;
    groupType: string | null;
  };
  setPendingSelection: (selection: {
    type: 'source' | 'destination' | null;
    modalType: 'add' | 'remove' | null;
    groupId: string | null;
    groupType: string | null;
  }) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState({
    type: null as 'source' | 'destination' | null,
    modalType: null as 'add' | 'remove' | null,
    groupId: null as string | null,
    groupType: null as string | null,
  });

  return (
    <ModalContext.Provider value={{ 
      isAnyModalOpen, 
      setIsAnyModalOpen, 
      pendingSelection, 
      setPendingSelection 
    }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
