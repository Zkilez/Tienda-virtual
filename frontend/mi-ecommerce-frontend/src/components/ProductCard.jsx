// src/components/ProductCard.jsx
import React, { useState } from 'react';
import { FiShoppingCart, FiHeart, FiStar } from 'react-icons/fi';

const ProductCard = ({ 
  title, 
  description, 
  price, 
  oldPrice, 
  imageUrl, 
  fallbackImage, 
  isNew = false, 
  isBestSeller = false,
  rating = 0 
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden relative group">
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 space-y-1">
        {isNew && (
          <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Nuevo
          </span>
        )}
        {isBestSeller && (
          <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Más vendido
          </span>
        )}
      </div>

      {/* Favorite button */}
      <button 
        onClick={() => setIsFavorite(!isFavorite)}
        className={`absolute top-2 right-2 z-10 p-2 rounded-full ${isFavorite ? 'text-red-500 bg-white' : 'text-gray-400 bg-white/80 hover:bg-white'}`}
      >
        <FiHeart className={isFavorite ? 'fill-current' : ''} />
      </button>

      {/* Product image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <img
          src={imageError ? (fallbackImage || 'https://via.placeholder.com/300x300?text=Imagen+no+disponible') : imageUrl}
          alt={title}
          className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          onError={handleImageError}
        />
      </div>

      {/* Product info */}
      <div className="p-4">
        <div className="flex items-center mb-1">
          {[...Array(5)].map((_, i) => (
            <FiStar 
              key={i} 
              className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
            />
          ))}
          <span className="text-xs text-gray-500 ml-1">({rating})</span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-2">{description}</p>
        
        <div className="flex items-center justify-between mt-3">
          <div>
            {oldPrice && (
              <p className="text-sm text-gray-400 line-through">${oldPrice}</p>
            )}
            <p className="text-xl font-bold text-gray-900">{price}</p>
          </div>
          <button className="flex items-center justify-center bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors">
            <FiShoppingCart />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;