import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiX, FiUser, FiLogOut } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; // Importamos el contexto del carrito

const Navbar = () => {
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarMenuUsuario, setMostrarMenuUsuario] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Obtenemos los datos del carrito del contexto
  const {
    cartItems,
    removeFromCart,
    clearCart,
    cartTotal,
    itemCount,
    loading: cartLoading,
    error: cartError,
    updatingItemId
  } = useCart();

  const toggleCarrito = () => {
    setMostrarCarrito(!mostrarCarrito);
    setMostrarMenuUsuario(false);
  };

  const toggleMenuUsuario = () => {
    setMostrarMenuUsuario(!mostrarMenuUsuario);
    setMostrarCarrito(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      await clearCart(); // Limpiamos el carrito al cerrar sesión
      navigate('/');
      setMostrarMenuUsuario(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await removeFromCart(productId);
    } catch (error) {
      console.error('Error al eliminar producto:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md px-8 py-4 relative z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-gray-900">Smartzone</Link>

        <ul className="flex space-x-6 text-gray-700 font-medium">
          <li><Link to="/" className="hover:text-blue-600">Inicio</Link></li>
          <li><Link to="/smartphones" className="hover:text-blue-600">Smartphones</Link></li>
          <li><Link to="/ofertas" className="hover:text-blue-600">Ofertas</Link></li>
          <li><Link to="/soporte" className="hover:text-blue-600">Soporte</Link></li>
        </ul>

        <div className="flex items-center space-x-4">
          {/* Notificación de error del carrito */}
          {cartError && (
            <div className="text-red-500 text-sm mr-2">
              {cartError}
              <button onClick={() => {}} className="ml-2">×</button>
            </div>
          )}

          {/* Icono del carrito */}
          <div className="relative">
            <button 
              onClick={toggleCarrito} 
              className="text-gray-700 hover:text-blue-600 text-2xl relative"
              aria-label="Carrito de compras"
              aria-expanded={mostrarCarrito}
              disabled={cartLoading}
            >
              <FiShoppingCart />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Dropdown del carrito */}
            <AnimatePresence>
              {mostrarCarrito && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white shadow-xl rounded-lg z-50 overflow-hidden border border-gray-100"
                >
                  <div className="max-h-80 overflow-y-auto">
                    {cartItems.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {cartError ? 'Error al cargar el carrito' : 'Tu carrito está vacío.'}
                      </div>
                    ) : (
                      cartItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center px-4 py-3 border-b">
                          <div>
                            <h4 className="font-semibold text-gray-800">{item.producto.nombre}</h4>
                            <p className="text-sm text-gray-600">Cantidad: {item.cantidad}</p>
                            <p className="text-sm text-gray-600">Precio: ${item.producto.precio.toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.producto.id)}
                            className="text-red-500 hover:text-red-700 text-xl"
                            disabled={updatingItemId === item.producto.id || cartLoading}
                            aria-label={`Eliminar ${item.producto.nombre} del carrito`}
                          >
                            {updatingItemId === item.producto.id ? '...' : <FiX />}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  {cartItems.length > 0 && (
                    <div className="p-4 border-t">
                      <div className="flex justify-between font-semibold text-gray-800 mb-4">
                        <span>Total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                      <Link
                        to="/pago"
                        className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition disabled:opacity-50"
                        onClick={() => setMostrarCarrito(false)}
                      >
                        {cartLoading ? 'Procesando...' : 'Comprar'}
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Menú de usuario */}
          <div className="relative">
            {isAuthenticated ? (
              <>
                <button 
                  onClick={toggleMenuUsuario}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1 transition"
                  aria-label="Menú de usuario"
                  aria-expanded={mostrarMenuUsuario}
                >
                  <FiUser className="text-gray-700" />
                  <span className="font-medium text-gray-700">{user?.nombre || 'Mi cuenta'}</span>
                </button>

                <AnimatePresence>
                  {mostrarMenuUsuario && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl rounded-lg z-50 overflow-hidden border border-gray-100"
                    >
                      <Link
                        to="/perfil"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50"
                        onClick={() => setMostrarMenuUsuario(false)}
                      >
                        Mi perfil
                      </Link>
                      <Link
                        to="/pedidos"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50"
                        onClick={() => setMostrarMenuUsuario(false)}
                      >
                        Mis pedidos
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 text-left"
                      >
                        <FiLogOut className="mr-2" /> Cerrar sesión
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="flex space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-1"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;