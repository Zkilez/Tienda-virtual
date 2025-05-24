"use client"

import { useState, useEffect } from "react"
import { FiX } from "react-icons/fi"
import { motion, AnimatePresence } from "framer-motion"
import Chatbot from "./Chatbot"
import RobotChatIcon from "./RobotChatIcon"

const ChatbotLauncher = ({ user, products, cart, cartFunctions }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastMessageTime, setLastMessageTime] = useState(null)

  useEffect(() => {
    if (!isOpen && lastMessageTime) {
      setUnreadCount((prev) => prev + 1) // Incrementa si el chat está cerrado y hay nuevos mensajes
    }
  }, [lastMessageTime, isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setUnreadCount(0) // Resetea el contador al abrir el chat
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              mass: 0.5,
            }}
            className="mb-4 origin-bottom-right"
            style={{
              position: "fixed",
              bottom: "160px",
              right: "20px",
              width: "400px",
              height: "600px",
              maxWidth: "calc(100vw - 40px)",
              maxHeight: "calc(100vh - 200px)",
            }}
          >
            <Chatbot
              user={user}
              products={products}
              cart={cart}
              onClose={() => setIsOpen(false)}
              onMessageSent={() => setLastMessageTime(Date.now())}
              cartFunctions={cartFunctions}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icono de apertura/cierre del chatbot */}
      <motion.div
        onClick={handleToggle}
        className="relative cursor-pointer"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
        style={{ width: "140px", height: "140px" }}
      >
        <RobotChatIcon size={140} showSpeechBubble={!isOpen && unreadCount > 0} />

        {/* Mostrar la cantidad de mensajes no leídos si el chat está cerrado */}
        {unreadCount > 0 && !isOpen && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 bg-red-500 text-white text-sm font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md"
          >
            {unreadCount}
          </motion.span>
        )}

        {/* Mostrar la cantidad de productos en el carrito si hay productos */}
        {cart && cart.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute bottom-1 right-1 bg-green-500 text-white text-sm font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md"
          >
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </motion.span>
        )}

        {/* Botón de cerrar el chat */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
            className="absolute top-0 right-0 bg-red-500 rounded-full p-1.5 shadow-lg"
          >
            <FiX className="text-white text-lg" />
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default ChatbotLauncher