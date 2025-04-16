import React, { useState } from 'react';
import { FiMessageSquare, FiX, FiArrowRight, FiCheck, FiShield, FiTruck, FiPhone, FiShoppingCart } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import Chatbot from '../components/Chatbot';

const Home = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [cart, setCart] = useState([]); // Estado para el carrito de compras
  const { user } = useAuth();

  // Productos destacados
  const featuredProducts = [
    {
      id: 1,
      title: "Galaxy S23 Ultra",
      description: "Cámara de 200MP, S-Pen integrado, 12GB RAM, 256GB",
      price: "$1,199.89",
      oldPrice: "$1,406.47"
    },
    {
      id: 2,
      title: "iPhone 15 Pro",
      description: "Chip A17 Pro, Titanio, Cámara 48MP, 128GB",
      price: "$999.59",
      oldPrice: "$1,245.97"
    },
    {
      id: 3,
      title: "Xiaomi 14 Pro",
      description: "Pantalla AMOLED 120Hz, Snapdragon 8 Gen 3, 256GB",
      price: "$899.39",
      oldPrice: "$1,146.87"
    },
    {
      id: 4,
      title: "Google Pixel 8 Pro",
      description: "Tensor G3, IA avanzada, Cámara 50MP, 128GB",
      price: "$799.29",
      oldPrice: "$1,046.47"
    }
  ];

  // Marcas asociadas
  const brands = ['Samsung', 'Apple', 'Xiaomi', 'OnePlus'];

  // Función para agregar productos al carrito
  const handleAddToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Función para remover productos del carrito
  const handleRemoveFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Función para actualizar cantidad de productos
  const handleUpdateQuantity = (productId, quantity) => {
    setCart(prev => prev.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    alert(`Gracias por suscribirte con el email: ${email}`);
    setEmail('');
  };

  return (
    <div className="bg-gray-50 min-h-screen relative">
      {/* Hero Section */}
      <section className="bg-white py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Descubre la mejor tecnología móvil</h1>
          <p className="text-xl mb-8">
            Interactúa con nuestro asistente para descubrir productos y realizar compras
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
              Ver indicaciones inteligentes
            </button>
            <button className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg">
              Cómo funciona
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <FiTruck className="text-3xl text-blue-500 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Envío Expreso</h3>
            <p>Entrega en 24-48h con experiencia al tiempo total</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <FiShield className="text-3xl text-blue-500 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Garantía Extendida</h3>
            <p>2 años de garantía sin costo adicional</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <FiCheck className="text-3xl text-blue-500 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Devoluciones</h3>
            <p>30 días para devoluciones sin preguntas</p>
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Teléfonos inteligentes destacados</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2">{product.title}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-blue-600 font-bold text-lg">{product.price}</span>
                  <span className="text-gray-400 line-through text-sm">{product.oldPrice}</span>
                </div>
                <button 
                  onClick={() => handleAddToCart(product)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <FiShoppingCart /> Añadir al carrito
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Marcas Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto bg-white">
        <h2 className="text-3xl font-bold text-center mb-12">Marcas que nos respaldan</h2>
        <div className="flex flex-wrap justify-center gap-8">
          {brands.map((brand, index) => (
            <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              {brand}
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto bg-gray-100">
        <h2 className="text-3xl font-bold text-center mb-6">Mantente actualizado</h2>
        <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Tu correo electrónico"
            className="flex-1 px-4 py-2 rounded-l-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-r-lg"
          >
            Suscribirse
          </button>
        </form>
      </section>

      {/* Chatbot */}
      {user && (
        <>
          <motion.button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`fixed bottom-6 right-6 z-50 ${isChatOpen ? 'opacity-0' : 'opacity-100'}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-xl text-white">
              <FiMessageSquare className="text-2xl" />
            </div>
          </motion.button>

          {isChatOpen && (
            <Chatbot 
              user={user}
              products={featuredProducts}
              cart={cart}
              onClose={() => setIsChatOpen(false)}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              onUpdateQuantity={handleUpdateQuantity}
            />
          )}
        </>
      )}

      <Footer />
    </div>
  );
};

export default Home;