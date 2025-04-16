import React, { useState, useEffect } from 'react';
import { FiX, FiArrowRight, FiShoppingCart } from 'react-icons/fi';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const Chatbot = ({ 
  user = {}, 
  products = [], 
  cart = [], 
  onAddToCart = () => {}, 
  onRemoveFromCart = () => {},
  onUpdateQuantity = () => {},
  onClose = () => {}
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // Función segura para calcular el total del carrito
  const calculateTotal = (cartItems) => {
    if (!cartItems || !Array.isArray(cartItems)) return 0;
    
    return cartItems.reduce((sum, item) => {
      try {
        const price = parseFloat(item?.price?.replace('$', '')?.replace(',', '') || '0');
        const quantity = item?.quantity || 0;
        return sum + (price * quantity);
      } catch (error) {
        console.error("Error calculando precio:", error);
        return sum;
      }
    }, 0);
  };

  // Respuestas inteligentes del bot con manejo seguro
  const getBotResponse = (userMessage) => {
    const lowerMsg = userMessage?.toLowerCase() || '';
    
    if (lowerMsg.includes('hola') || lowerMsg.includes('buenos días')) {
      return {
        text: `¡Hola ${user?.name || 'amigo'}! 👋 Soy tu asistente de compras.`,
        options: ['Ver productos', 'Ver carrito', 'Ofertas']
      };
    }
    
    if (lowerMsg.includes('producto') || lowerMsg.includes('ver') || lowerMsg.includes('mostrar')) {
      const safeProducts = Array.isArray(products) ? products.slice(0, 4) : [];
      return {
        text: "Tenemos estos smartphones disponibles:",
        products: safeProducts,
        options: ['Ver más productos']
      };
    }
    
    if (lowerMsg.includes('carrito') || lowerMsg.includes('comprar')) {
      if (!cart || cart.length === 0) {
        return {
          text: "Tu carrito está vacío. ¿Quieres ver algunos productos?",
          options: ['Ver productos', 'Ofertas']
        };
      }
      
      const cartItems = cart.map(item => 
        `- ${item?.title || 'Producto'} x${item?.quantity || 1} (${item?.price || '$0.00'})`
      ).join('\n');
      
      return {
        text: `🛒 Tu carrito:\n${cartItems}\n\nTotal: $${calculateTotal(cart).toFixed(2)}\n\n¿Qué deseas hacer?`,
        options: ['Finalizar compra', 'Seguir comprando', 'Vaciar carrito']
      };
    }
    
    return {
      text: "Puedo ayudarte a encontrar productos o gestionar tu compra. ¿Qué necesitas?",
      options: ['Ver productos', 'Ver carrito', 'Ayuda']
    };
  };

  // Manejo seguro del envío de mensajes
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!message?.trim()) return;
    
    const userMessage = { text: message, sender: 'user' };
    setMessages(prev => [...(prev || []), userMessage]);
    setMessage('');
    setIsTyping(true);
    
    setTimeout(() => {
      try {
        const botResponse = getBotResponse(message);
        const botMessage = { 
          text: botResponse.text, 
          sender: 'bot',
          options: botResponse.options,
          products: botResponse.products
        };
        
        setMessages(prev => [...(prev || []), botMessage]);
      } catch (error) {
        console.error("Error generating bot response:", error);
        setMessages(prev => [...(prev || []), { 
          text: "Lo siento, ocurrió un error. Por favor intenta nuevamente.", 
          sender: 'system' 
        }]);
      } finally {
        setIsTyping(false);
      }
    }, 800);
  };

  // Mensaje inicial con verificación
  useEffect(() => {
    setMessages([{ 
      text: `¡Hola ${user?.name || 'amigo'}! 👋 Soy tu asistente de compras.`, 
      sender: 'bot',
      options: ['Ver productos', 'Ofertas', 'Ayuda']
    }]);
  }, [user]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-80 bg-white shadow-2xl rounded-xl border border-gray-200 flex flex-col"
      style={{ height: '500px', maxHeight: '80vh' }}
    >
      {/* Header con botón de cerrar */}
      <div className="bg-blue-600 text-white p-4 rounded-t-xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
            <FiShoppingCart className="text-white" />
          </div>
          <div>
            <h4 className="font-bold">Asistente de Compras</h4>
            <p className="text-xs text-blue-100">En línea</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <FiShoppingCart className="text-white" />
            {(cart?.length || 0) > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.reduce((sum, item) => sum + (item?.quantity || 0), 0)}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-blue-200 ml-2"
          >
            <FiX />
          </button>
        </div>
      </div>
      
      {/* Cuerpo del chat con manejo seguro */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {(messages || []).map((msg, index) => (
          <div key={`msg-${index}`} className={`flex ${msg?.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-xl p-3 max-w-[85%] ${
              msg?.sender === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : msg?.sender === 'system'
                ? 'bg-green-100 text-green-800 rounded-bl-none'
                : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
            }`}>
              <p className="whitespace-pre-line">{msg?.text || ''}</p>
              
              {/* Opciones rápidas con verificación */}
              {(msg?.options || []).map((option, i) => (
                <button
                  key={`opt-${i}`}
                  onClick={() => {
                    setMessage(option);
                    setTimeout(() => handleSendMessage({ preventDefault: () => {} }), 100);
                  }}
                  className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors mr-2 mt-2"
                >
                  {option}
                </button>
              ))}
              
              {/* Productos recomendados con verificación */}
              {(msg?.products || []).map((product) => (
                <div key={`prod-${product?.id}`} className="border-t pt-2 border-gray-200 mt-2">
                  <div className="font-semibold">{product?.title || 'Producto'}</div>
                  <div className="text-sm text-gray-600">{product?.description || ''}</div>
                  <div className="font-bold text-blue-600 my-1">{product?.price || '$0.00'}</div>
                  <button 
                    onClick={() => {
                      if (product) {
                        onAddToCart(product);
                        setMessages(prev => [...(prev || []), { 
                          text: `✅ ${product.title} añadido al carrito`, 
                          sender: 'system' 
                        }]);
                      }
                    }}
                    className="text-xs bg-green-500 text-white px-3 py-1 rounded-full mt-1 hover:bg-green-600 transition-colors flex items-center gap-1"
                    disabled={!product}
                  >
                    <FiShoppingCart size={12} /> Añadir al carrito
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 rounded-xl rounded-bl-none p-3 shadow-sm max-w-[50%]">
              <div className="flex space-x-2">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={`typing-${i}`}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input para enviar mensajes */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e?.target?.value || '')}
            placeholder="Escribe tu mensaje..."
            className="w-full px-4 py-3 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
          />
          <button 
            type="submit" 
            disabled={!message.trim()}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
              message.trim() ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400'
            }`}
          >
            <FiArrowRight />
          </button>
        </form>
      </div>
    </motion.div>
  );
};

Chatbot.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string
  }),
  products: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    price: PropTypes.string.isRequired,
    quantity: PropTypes.number
  })),
  cart: PropTypes.array,
  onAddToCart: PropTypes.func,
  onRemoveFromCart: PropTypes.func,
  onUpdateQuantity: PropTypes.func,
  onClose: PropTypes.func
};

Chatbot.defaultProps = {
  user: {},
  products: [],
  cart: [],
  onAddToCart: () => {},
  onRemoveFromCart: () => {},
  onUpdateQuantity: () => {},
  onClose: () => {}
};

export default Chatbot;