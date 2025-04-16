import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Pedidos = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Aquí harías la petición al backend para obtener los pedidos del usuario autenticado
    // Por ahora usamos datos simulados:
    const pedidosEjemplo = [
      {
        id: 1,
        fecha: '2025-04-08',
        total: 1999,
        estado: 'Enviado',
        productos: [
          { nombre: 'iPhone 13', cantidad: 1 },
          { nombre: 'Samsung Galaxy S22', cantidad: 2 }
        ]
      },
      {
        id: 2,
        fecha: '2025-03-25',
        total: 899,
        estado: 'Entregado',
        productos: [
          { nombre: 'Xiaomi Redmi Note 12', cantidad: 1 }
        ]
      }
    ];

    setTimeout(() => {
      setPedidos(pedidosEjemplo);
      setCargando(false);
    }, 1000); // Simulamos carga de datos
  }, []);

  if (cargando) {
    return <div className="p-6 text-center">Cargando pedidos...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Mis pedidos</h2>
      {pedidos.length === 0 ? (
        <p className="text-gray-600">Aún no has realizado ningún pedido.</p>
      ) : (
        pedidos.map((pedido) => (
          <div key={pedido.id} className="bg-white shadow rounded-lg mb-4 p-4 border border-gray-200">
            <div className="flex justify-between mb-2">
              <div>
                <p className="text-sm text-gray-600">Pedido #{pedido.id}</p>
                <p className="text-sm text-gray-600">Fecha: {pedido.fecha}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-600">Estado: {pedido.estado}</p>
                <p className="text-sm font-semibold text-gray-800">Total: ${pedido.total}</p>
              </div>
            </div>
            <div className="mt-2">
              <h4 className="font-semibold text-gray-700 mb-1">Productos:</h4>
              <ul className="list-disc pl-5 text-gray-700">
                {pedido.productos.map((producto, idx) => (
                  <li key={idx}>{producto.nombre} x{producto.cantidad}</li>
                ))}
              </ul>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Pedidos;
