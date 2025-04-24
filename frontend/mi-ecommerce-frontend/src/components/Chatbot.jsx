import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiArrowRight, FiShoppingCart, FiTrash2, FiRefreshCw, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const Chatbot = ({ 
  user = {}, 
  products = [], 
  cart = [], 
  onAddToCart = () => {}, 
  onRemoveFromCart = () => {},
  onUpdateQuantity = () => {},
  onClose = () => {},
  onMessageSent = () => {}
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const isAutoScrolling = useRef(false);

  // Función para calcular el total del carrito
  const calculateTotal = useCallback((cartItems) => {
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
  }, []);

  // Función para eliminar productos del carrito
  const handleRemoveFromCart = useCallback((productId) => {
    const product = cart.find(item => item.id === productId);
    if (product) {
      onRemoveFromCart(productId);
      setMessages(prev => [...(prev || []), { 
        text: `🗑️ ${product.title} eliminado del carrito`, 
        sender: 'system' 
      }]);
    }
  }, [cart, onRemoveFromCart]);

  // Función para vaciar todo el carrito
  const handleEmptyCart = useCallback(() => {
    if (cart.length > 0) {
      const cartItemIds = cart.map(item => item.id);
      cartItemIds.forEach(id => onRemoveFromCart(id));
      setMessages(prev => [...(prev || []), { 
        text: "🗑️ Se han eliminado todos los productos del carrito", 
        sender: 'system' 
      }]);
    }
  }, [cart, onRemoveFromCart]);

  // Función para limpiar el historial del chat
  const clearChat = useCallback(() => {
    setMessages([{ 
      text: `¡Hola ${user?.name || 'amigo'}! 👋 Soy tu asistente de compras. ¿En qué puedo ayudarte hoy?`, 
      sender: 'bot',
      options: ['Ver productos', 'Ver carrito', 'Ofertas']
    }]);
  }, [user?.name]);

  // Funciones para desplazamiento
  const scrollToTop = useCallback(() => {
    if (chatRef.current) {
      isAutoScrolling.current = true;
      chatRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 1000);
    }
  }, []);

  const scrollToBottom = useCallback((options = {}) => {
    if (chatRef.current) {
      const { behavior = 'smooth', force = false } = options;
      
      const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      
      if (force || distanceFromBottom < 200) {
        isAutoScrolling.current = true;
        chatRef.current.scrollTo({
          top: scrollHeight,
          behavior
        });
        setTimeout(() => {
          isAutoScrolling.current = false;
        }, 1000);
      }
    }
  }, []);

  // Manejar scroll para mostrar/ocultar botones
  const handleScroll = useCallback(() => {
    if (!chatRef.current || isAutoScrolling.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 20;
    const isAtTop = scrollTop < 20;
    
    setShowScrollButtons(!isAtTop || !isAtBottom);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setShowScrollButtons(false);
    }, 3000);
  }, []);

  // Respuestas inteligentes del bot
  const getBotResponse = useCallback((userMessage) => {
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
        text: "Tenemos estos productos disponibles:",
        products: safeProducts,
        options: ['Ver más productos', 'Ver carrito']
      };
    }
    
    if (lowerMsg.includes('carrito') || lowerMsg.includes('comprar') || lowerMsg.includes('ver carrito')) {
      if (!cart || cart.length === 0) {
        return {
          text: "Tu carrito está vacío. ¿Quieres ver algunos productos?",
          options: ['Ver productos', 'Ofertas']
        };
      }
      
      const cartItems = cart.map(item => ({
        id: item.id,
        title: item?.title || 'Producto',
        quantity: item?.quantity || 1,
        price: item?.price || '$0.00',
        text: `- ${item?.title || 'Producto'} x${item?.quantity || 1} (${item?.price || '$0.00'})`
      }));
      
      return {
        text: `🛒 Tu carrito (${cart.reduce((sum, item) => sum + (item?.quantity || 0), 0)} items):\n${cartItems.map(i => i.text).join('\n')}\n\nTotal: $${calculateTotal(cart).toFixed(2)}`,
        cartItems: cartItems,
        options: ['Finalizar compra', 'Seguir comprando', 'Vaciar carrito']
      };
    }
    
    if (lowerMsg.includes('vaciar') || lowerMsg.includes('eliminar todo')) {
      handleEmptyCart();
      return {
        text: "¿Qué más puedo hacer por ti?",
        options: ['Ver productos', 'Ayuda']
      };
    }
    
    if (lowerMsg.includes('limpiar chat') || lowerMsg.includes('borrar historial')) {
      clearChat();
      return {
        text: "El historial del chat ha sido limpiado. ¿En qué más puedo ayudarte?",
        options: ['Ver productos', 'Ver carrito', 'Ofertas']
      };
    }
    
    return {
      text: "Puedo ayudarte a encontrar productos o gestionar tu compra. ¿Qué necesitas?",
      options: ['Ver productos', 'Ver carrito', 'Ayuda']
    };
  }, [user?.name, products, cart, calculateTotal, handleEmptyCart, clearChat]);

  // Manejo del envío de mensajes
  const handleSendMessage = useCallback((e) => {
    e?.preventDefault();
    if (!message?.trim()) return;
    
    const userMessage = { text: message, sender: 'user' };
    setMessages(prev => [...(prev || []), userMessage]);
    setMessage('');
    setIsTyping(true);
    onMessageSent();
    
    setTimeout(() => {
      try {
        const botResponse = getBotResponse(message);
        const botMessage = { 
          text: botResponse.text, 
          sender: 'bot',
          options: botResponse.options,
          products: botResponse.products,
          cartItems: botResponse.cartItems
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
        scrollToBottom({ behavior: 'smooth', force: true });
      }
    }, 800);
  }, [message, getBotResponse, onMessageSent, scrollToBottom]);

  // Mensaje inicial
  useEffect(() => {
    setMessages([{ 
      text: `¡Hola ${user?.name || 'amigo'}! 👋 Soy tu asistente de compras. ¿En qué puedo ayudarte hoy?`, 
      sender: 'bot',
      options: ['Ver productos', 'Ofertas', 'Ayuda']
    }]);
  }, [user?.name]);

  // Auto scroll al final de los mensajes
  useEffect(() => {
    scrollToBottom({ behavior: 'auto' });
  }, [messages, scrollToBottom]);

  // Enfocar el input al abrir
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-full h-full flex flex-col bg-white rounded-xl shadow-xl overflow-hidden relative"
    >
      {/* Header */}
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
      
      {/* Botones de desplazamiento mejorados */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollButtons ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute right-4 top-16 flex flex-col gap-2 z-10"
      >
        <button
          onClick={scrollToTop}
          className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md flex items-center justify-center transition-all hover:shadow-lg"
          title="Ir al inicio"
        >
          <FiChevronUp size={16} />
        </button>
        <button
          onClick={() => scrollToBottom({ behavior: 'smooth', force: true })}
          className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md flex items-center justify-center transition-all hover:shadow-lg"
          title="Ir al final"
        >
          <FiChevronDown size={16} />
        </button>
      </motion.div>

      {/* Cuerpo del chat con mejoras de scroll */}
      <div 
        ref={chatRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        onMouseEnter={() => setShowScrollButtons(true)}
        onMouseLeave={() => {
          if (chatRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
            const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 20;
            const isAtTop = scrollTop < 20;
            setShowScrollButtons(!isAtTop || !isAtBottom);
          }
        }}
      >
        {(messages || []).map((msg, index) => (
          <div key={`msg-${index}`} className={`flex ${msg?.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`rounded-xl p-3 max-w-[85%] ${
                msg?.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : msg?.sender === 'system'
                  ? 'bg-green-100 text-green-800 rounded-bl-none'
                  : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
              }`}
            >
              <p className="whitespace-pre-line">{msg?.text || ''}</p>
              
              {/* Opciones rápidas */}
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
              
              {/* Productos recomendados */}
              {(msg?.products || []).map((product) => (
                <motion.div 
                  key={`prod-${product?.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="border-t pt-2 border-gray-200 mt-2"
                >
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
                </motion.div>
              ))}
              
              {/* Items del carrito con opción de eliminar */}
              {(msg?.cartItems || []).map((item) => (
                <motion.div 
                  key={`cartitem-${item.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="border-t pt-2 border-gray-200 mt-2 flex justify-between items-center"
                >
                  <div>
                    <div>{item.text}</div>
                    {item.quantity > 1 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Cantidad: {item.quantity}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="text-xs bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="text-xs bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Eliminar del carrito"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))}
        
        {/* Indicador de que el bot está escribiendo */}
        {isTyping && (
          <div className="flex justify-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white text-gray-800 rounded-xl rounded-bl-none p-3 shadow-sm max-w-[50%]"
            >
              <div className="flex space-x-2 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.div 
                    key={`typing-${i}`}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ 
                      repeat: Infinity,
                      duration: 0.8,
                      delay: i * 0.2
                    }}
                  />
                ))}
                <span className="ml-2 text-xs text-gray-500">escribiendo...</span>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      
      {/* Input para enviar mensajes */}
      <div className="p-4 border-t border-gray-200 bg-white relative">
        <button
          onClick={clearChat}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
          title="Limpiar chat"
        >
          <FiRefreshCw size={18} />
        </button>
        
        <form onSubmit={handleSendMessage} className="relative ml-8">
          <input
            ref={inputRef}
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
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      description: PropTypes.string,
      price: PropTypes.string
    })
  ),
  cart: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      price: PropTypes.string,
      quantity: PropTypes.number
    })
  ),
  onAddToCart: PropTypes.func,
  onRemoveFromCart: PropTypes.func,
  onUpdateQuantity: PropTypes.func,
  onClose: PropTypes.func,
  onMessageSent: PropTypes.func
};

export default Chatbot;