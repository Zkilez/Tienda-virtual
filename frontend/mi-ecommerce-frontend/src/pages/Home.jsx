import React, { useState } from 'react';
import { FiCheck, FiShield, FiTruck, FiShoppingCart } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import ChatbotLauncher from '../components/ChatbotLauncher';

const Home = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [cart, setCart] = useState([]);

  // Productos destacados
  const featuredProducts = [
    {
      id: 1,
      title: "Galaxy S23 Ultra",
      description: "Cámara de 200MP, S-Pen integrado, 12GB RAM, 256GB",
      price: "$1,199.89",
      oldPrice: "$1,406.47",
      image: "/images/galaxy-s23-ultra.jpg"
    },
    {
      id: 2,
      title: "iPhone 15 Pro",
      description: "Chip A17 Pro, Titanio, Cámara 48MP, 128GB",
      price: "$999.59",
      oldPrice: "$1,245.97",
      image: "/images/iphone-15-pro.jpg"
    },
    {
      id: 3,
      title: "Xiaomi 14 Pro",
      description: "Pantalla AMOLED 120Hz, Snapdragon 8 Gen 3, 256GB",
      price: "$899.39",
      oldPrice: "$1,146.87",
      image: "/images/xiaomi-14-pro.jpg"
    },
    {
      id: 4,
      title: "Google Pixel 8 Pro",
      description: "Tensor G3, IA avanzada, Cámara 50MP, 128GB",
      price: "$799.29",
      oldPrice: "$1,046.47",
      image: "/images/pixel-8-pro.jpg"
    }
  ];

  // Marcas asociadas
  const brands = ['Samsung', 'Apple', 'Xiaomi', 'OnePlus', 'Google', 'Oppo'];

  // Funciones del carrito agrupadas
  const cartFunctions = {
    onAddToCart: (product) => {
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === product.id);
        if (existingItem) {
          toast.info(`Cantidad actualizada: ${product.title}`);
          return prevCart.map(item => 
            item.id === product.id 
              ? { ...item, quantity: item.quantity + 1 } 
              : item
          );
        }
        toast.success(`${product.title} añadido al carrito`);
        return [...prevCart, { ...product, quantity: 1 }];
      });
    },
    onRemoveFromCart: (productId) => {
      setCart(prev => {
        const product = prev.find(item => item.id === productId);
        if (product) {
          toast.warning(`${product.title} eliminado del carrito`);
        }
        return prev.filter(item => item.id !== productId);
      });
    },
    onUpdateQuantity: (productId, quantity) => {
      if (quantity < 1) {
        cartFunctions.onRemoveFromCart(productId);
        return;
      }
      
      setCart(prev => {
        const updatedCart = prev.map(item =>
          item.id === productId ? { ...item, quantity } : item
        );
        const product = updatedCart.find(item => item.id === productId);
        if (product) {
          toast.info(`Cantidad actualizada: ${product.title} x${quantity}`);
        }
        return updatedCart;
      });
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    toast.success(`Gracias por suscribirte con el email: ${email}`);
    setEmail('');
  };

  return (
    <div className="bg-gray-50 min-h-screen relative">
      {/* Hero Section */}
      <section className="bg-white py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Descubre la mejor tecnología móvil
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl mb-8"
          >
            Encuentra los smartphones más avanzados al mejor precio
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
              Ver catálogo completo
            </button>
            <button className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg transition-colors">
              Comparar modelos
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-3xl font-bold text-center mb-12"
        >
          Por qué elegirnos
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              icon: <FiTruck className="text-3xl text-blue-500 mx-auto mb-4" />, 
              title: "Envío Rápido", 
              text: "Recibe tu pedido en 24-48 horas hábiles" 
            },
            { 
              icon: <FiShield className="text-3xl text-blue-500 mx-auto mb-4" />, 
              title: "Garantía Extendida", 
              text: "2 años de garantía en todos nuestros productos" 
            },
            { 
              icon: <FiCheck className="text-3xl text-blue-500 mx-auto mb-4" />, 
              title: "Devoluciones Fáciles", 
              text: "30 días para devoluciones sin complicaciones" 
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.7, duration: 0.3 }}
              className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow"
            >
              {feature.icon}
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="py-16 px-4 max-w-6xl mx-auto" id="productos">
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="text-3xl font-bold text-center mb-12"
        >
          Nuestros productos destacados
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map((product, index) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 1.1, duration: 0.3 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="object-contain h-full p-4"
                />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2">{product.title}</h3>
                <p className="text-gray-600 mb-4 text-sm">{product.description}</p>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-blue-600 font-bold text-lg">{product.price}</span>
                  <span className="text-gray-400 line-through text-sm">{product.oldPrice}</span>
                </div>
                <button 
                  onClick={() => {
                    cartFunctions.onAddToCart(product);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FiShoppingCart /> Añadir al carrito
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Marcas Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto bg-white">
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-3xl font-bold text-center mb-12"
        >
          Marcas que confían en nosotros
        </motion.h2>
        <div className="flex flex-wrap justify-center gap-6">
          {brands.map((brand, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 1.6, duration: 0.3 }}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all"
            >
              <span className="text-lg font-medium text-gray-700">{brand}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto bg-gray-100 rounded-lg my-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Únete a nuestra comunidad</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Recibe las últimas noticias, ofertas exclusivas y actualizaciones de productos directamente en tu bandeja de entrada.
          </p>
          <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo electrónico"
              className="flex-1 px-4 py-3 rounded-l-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-r-lg transition-colors"
            >
              Suscribirse
            </button>
          </form>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Chatbot Launcher - Componente independiente */}
      {user && (
        <ChatbotLauncher 
          user={user}
          products={featuredProducts}
          cart={cart}
          cartFunctions={cartFunctions}
        />
      )}
    </div>
  );
};

export default Home;