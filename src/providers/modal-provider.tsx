"use client";
//import { PricesList, TicketDetails } from '@/lib/types'
import { Agency, Contact, User } from "@prisma/client";
import React, { useState, createContext, useEffect, useContext } from "react";

// Interface defining the props for the ModalProvider
interface ModalProviderProps {
  children: React.ReactNode; // ModalProvider wraps around other components
}

// Type definition for the data that can be passed to the modal
export type ModalData = {
  user?: User; // Optional user data
  agency?: Agency; // Optional agency data
};

// Type definition for the context that will be shared via ModalContext
type ModalContextType = {
  data: ModalData; // Data to be used by the modal
  isOpen: boolean; // Boolean indicating if the modal is open
  setOpen: (modal: React.ReactNode, fetchData?: () => Promise<any>) => void; // Function to open the modal
  setClose: () => void; // Function to close the modal
};

// Create a context with a default value
export const ModalContext = createContext<ModalContextType>({
  data: {}, // Initial data is an empty object
  isOpen: false, // Initially, the modal is not open
  setOpen: (modal: React.ReactNode, fetchData?: () => Promise<any>) => {}, //Default no-op functions
  setClose: () => {},
});

// ModalProvider component to manage modal state and provide it via context
const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false); // State to track if the modal is open
  const [data, setData] = useState<ModalData>({}); // State to hold modal data
  const [showingModal, setShowingModal] = useState<React.ReactNode>(null); // State to hold the currently displayed modal component
  const [isMounted, setIsMounted] = useState(false); // State to track if the component has mounted

  // useEffect to set the isMounted state to true after the component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // function to open the modal
  const setOpen = async (
    modal: React.ReactNode,
    fetchData?: () => Promise<any>
  ) => {
    if (modal) {
        // if a fetchData function is provided, fetch the data and merge it with the existing data
      if (fetchData) {
        setData(
          { ...data, ...(await fetchData()) } || {} // Merge fetched data with existing data
        );
      }
      setShowingModal(modal); // Set the modal component to be shown
      setIsOpen(true); //Set the modal to open
    }
  };

  // Function to close the modal and reset the data
  const setClose = () => {
    setIsOpen(false); // Close the modal
    setData({}); // Clear the modal
  };

  // If the component hasn't mounted yet, return null to prevent rendering
  if (!isMounted) return null;

  // Render the context provider and any modal that should be shown
  return (
    <ModalContext.Provider value={{ data, setOpen, setClose, isOpen }}>
      {children}
      {showingModal}
    </ModalContext.Provider>
  );
};

// Custom hook to use the modal context
export const useModal = () => {
    const context = useContext(ModalContext)
    if (!context) {
        throw new Error('useModal must be used within the modal provider')
    }
    return context
}

export default ModalProvider