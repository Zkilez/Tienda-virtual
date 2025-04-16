import React from 'react';
import { MessageCircle } from 'lucide-react'; // o cualquier ícono de chat

const ChatBotButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 z-50"
      aria-label="Abrir chat"
    >
      <MessageCircle size={24} />
    </button>
  );
};

export default ChatBotButton;