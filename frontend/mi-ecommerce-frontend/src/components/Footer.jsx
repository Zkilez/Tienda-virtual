import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#0b1120] text-white text-sm mt-10">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Marca */}
        <div>
          <h2 className="text-lg font-semibold mb-2">CelularesMax</h2>
          <p>Tu tienda especializada en smartphones y accesorios desde 2015.</p>
        </div>

        {/* Enlaces rápidos */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Enlaces rápidos</h2>
          <ul className="space-y-1">
            <li><a href="#" className="hover:underline">Inicio</a></li>
            <li><a href="#" className="hover:underline">Smartphones</a></li>
            <li><a href="#" className="hover:underline">Accesorios</a></li>
            <li><a href="#" className="hover:underline">Contacto</a></li>
          </ul>
        </div>

        {/* Ayuda */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Ayuda</h2>
          <ul className="space-y-1">
            <li><a href="#" className="hover:underline">Preguntas frecuentes</a></li>
            <li><a href="#" className="hover:underline">Garantía</a></li>
            <li><a href="#" className="hover:underline">Devoluciones</a></li>
            <li><a href="#" className="hover:underline">Política de privacidad</a></li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Contacto</h2>
          <p>Av. Tecnología 123<br />Madrid, CP 28001</p>
          <p className="mt-2">info@celularesmax.com<br />+34 912 345 678</p>
        </div>
      </div>

      {/* Línea final */}
      <div className="border-t border-gray-700 py-4 text-center text-gray-400">
        © 2025 CelularesMax. Todos los derechos reservados.
      </div>
    </footer>
  );
};

export default Footer;