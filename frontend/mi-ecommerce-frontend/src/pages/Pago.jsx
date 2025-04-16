// src/pages/Pago.jsx
import React, { useState } from 'react';
import { FiCreditCard, FiTruck, FiCheckCircle, FiLock } from 'react-icons/fi';

const Pago = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    telefono: '',
    email: '',
    metodoPago: 'tarjeta'
  });

  const productos = [
    { id: 1, nombre: 'iPhone 13', precio: 999, cantidad: 1 },
    { id: 2, nombre: 'Samsung Galaxy S22', precio: 799, cantidad: 2 }
  ];

  const calcularSubtotal = () => {
    return productos.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  };

  const calcularTotal = () => {
    return calcularSubtotal() + 15.99; // Subtotal + envío
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Finaliza tu compra
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Completa los siguientes pasos para completar tu pedido
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sección de información */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FiTruck className="mr-2" /> Información de envío
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                  <input
                    type="text"
                    name="codigoPostal"
                    value={formData.codigoPostal}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FiCreditCard className="mr-2" /> Método de pago
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="tarjeta"
                    name="metodoPago"
                    type="radio"
                    value="tarjeta"
                    checked={formData.metodoPago === 'tarjeta'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="tarjeta" className="ml-3 block text-sm font-medium text-gray-700">
                    Tarjeta de crédito/débito
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="paypal"
                    name="metodoPago"
                    type="radio"
                    value="paypal"
                    checked={formData.metodoPago === 'paypal'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="paypal" className="ml-3 block text-sm font-medium text-gray-700">
                    PayPal
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="transferencia"
                    name="metodoPago"
                    type="radio"
                    value="transferencia"
                    checked={formData.metodoPago === 'transferencia'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="transferencia" className="ml-3 block text-sm font-medium text-gray-700">
                    Transferencia bancaria
                  </label>
                </div>
              </div>
            </div>

            {formData.metodoPago === 'tarjeta' && (
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Detalles de la tarjeta</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de tarjeta</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de expiración</label>
                    <input
                      type="text"
                      placeholder="MM/AA"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resumen del pedido */}
          <div className="bg-white shadow rounded-lg p-6 h-fit sticky top-4">
            <h2 className="text-xl font-semibold mb-6">Resumen del pedido</h2>
            
            <div className="divide-y divide-gray-200">
              {productos.map((producto) => (
                <div key={producto.id} className="py-4 flex justify-between">
                  <div>
                    <h3 className="font-medium">{producto.nombre}</h3>
                    <p className="text-sm text-gray-500">Cantidad: {producto.cantidad}</p>
                  </div>
                  <p className="font-medium">${(producto.precio * producto.cantidad).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${calcularSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Envío</span>
                <span className="font-medium">$15.99</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold">${calcularTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8">
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-colors"
              >
                <FiLock className="mr-2" />
                Confirmar y pagar
              </button>
            </div>

            <div className="mt-4 flex items-center text-sm text-gray-500">
              <FiCheckCircle className="mr-2 text-green-500" />
              <span>Compra 100% segura - Protección de datos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pago;