import { createContext, useContext, useState } from 'react';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState(null);
  const [orderId, setOrderId] = useState(null);

  // Generate a unique order ID
  const generateOrderId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ACE-${timestamp}-${random}`;
  };

  return (
    <OrderContext.Provider
      value={{
        selectedService,
        setSelectedService,
        formData,
        setFormData,
        orderId,
        setOrderId,
        generateOrderId,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  return useContext(OrderContext);
}
