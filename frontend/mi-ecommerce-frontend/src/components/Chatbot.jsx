"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { FiX, FiArrowRight, FiShoppingCart, FiTrash2, FiChevronUp, FiChevronDown } from "react-icons/fi"
import { motion } from "framer-motion"
import PropTypes from "prop-types"

const Chatbot = ({ user = {}, onClose = () => {}, onMessageSent = () => {} }) => {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [showScrollButtons, setShowScrollButtons] = useState(false)
  const chatRef = useRef(null)
  const inputRef = useRef(null)
  const scrollTimeoutRef = useRef(null)
  const isAutoScrolling = useRef(false)
  const [comparisonMode, setComparisonMode] = useState(false)
  const [thumbHeight, setThumbHeight] = useState(20)
  const [scrollPosition, setScrollPosition] = useState(0)
  const thumbRef = useRef(null)
  const trackRef = useRef(null)
  const isDragging = useRef(false)
  const chatContainerRef = useRef(null)

  // Función para limpiar el historial del chat
  const clearChat = useCallback(() => {
    setMessages([
      {
        text: `¡Hola ${user?.name || "amigo"}! 👋 Soy tu asistente de smartphones. ¿Qué modelo buscas hoy?`,
        sender: "bot",
        options: ["Ver opciones", "Ayuda"],
      },
    ])
    setComparisonMode(false)
  }, [user?.name])

  // Funciones para desplazamiento mejoradas
  const scrollToTop = useCallback(() => {
    if (chatRef.current) {
      isAutoScrolling.current = true
      chatRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      })
      setTimeout(() => {
        isAutoScrolling.current = false
      }, 1000)
    }
  }, [])

  const scrollToBottom = useCallback((options = {}) => {
    if (chatRef.current) {
      const { behavior = "smooth", force = false } = options

      const { scrollTop, scrollHeight, clientHeight } = chatRef.current
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

      if (force || distanceFromBottom < 200) {
        isAutoScrolling.current = true
        chatRef.current.scrollTo({
          top: scrollHeight,
          behavior,
        })
        setTimeout(() => {
          isAutoScrolling.current = false
        }, 1000)
      }
    }
  }, [])

  // Manejar scroll para mostrar/ocultar botones y actualizar barra personalizada - MEJORADO
  const handleScroll = useCallback(() => {
    if (!chatRef.current || isAutoScrolling.current) return

    const { scrollTop, scrollHeight, clientHeight } = chatRef.current
    const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 20
    const isAtTop = scrollTop < 20

    setShowScrollButtons(!isAtTop || !isAtBottom)

    // Actualizar posición del thumb - CORREGIDO
    const maxScroll = scrollHeight - clientHeight
    if (maxScroll <= 0) {
      setScrollPosition(0)
    } else {
      const scrollPercentage = scrollTop / maxScroll
      const availableTrackHeight = clientHeight - thumbHeight
      const newPosition = scrollPercentage * availableTrackHeight
      setScrollPosition(newPosition)
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setShowScrollButtons(false)
    }, 3000)
  }, [thumbHeight])

  // Calcular tamaño del thumb de la barra de scroll - MEJORADO
  const calculateThumbSize = useCallback(() => {
    if (chatRef.current) {
      const { scrollHeight, clientHeight } = chatRef.current
      if (scrollHeight <= 0) return

      const ratio = clientHeight / scrollHeight
      const newHeight = Math.max(30, Math.min(ratio * clientHeight, clientHeight * 0.9))
      setThumbHeight(newHeight)
    }
  }, [])

  // Conexión con el backend Django - Versión Optimizada
  const getBotResponse = useCallback(
    async (userMessage) => {
      setIsTyping(true)

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // Timeout de 10 segundos

        const response = await fetch("http://localhost:8000/chatbot/api/chat/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            session_id: `user-${user?.id || "default"}-${Date.now()}`, // ID único de sesión
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Error en la solicitud: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        // Validación exhaustiva de la respuesta
        if (!data || typeof data !== "object") {
          throw new Error("Respuesta del servidor no válida")
        }

        // Manejo de estado de comparación
        const isComparisonPrompt = data.response?.includes("¿Qué modelos te gustaría comparar?")
        setComparisonMode(isComparisonPrompt)

        // Formateo avanzado de la respuesta
        const formattedResponse = formatBotResponse(data.response)

        return {
          text: formattedResponse,
          options: Array.isArray(data.options) ? data.options : [],
          source: data.source || "bot",
          isComparison: data.isComparison || false,
        }
      } catch (error) {
        console.error("Error en getBotResponse:", error)
        return {
          text: `⚠️ ${getUserFriendlyError(error)}`,
          options: ["Reintentar", "Ayuda"],
          source: "error",
        }
      } finally {
        setIsTyping(false)
      }
    },
    [user?.id],
  )

  // Función para formatear respuestas del bot
  const formatBotResponse = (response) => {
    if (!response) return "Lo siento, no recibí respuesta del servidor."

    // Formatear tablas de comparación
    if (response.includes("|") && response.includes("-")) {
      return response
        .replace(/\n/g, "<br>")
        .replace(/\|/g, "│") // Usar caracteres de caja mejorados
        .replace(/-+/g, "─")
    }

    return response.replace(/\n/g, "<br>")
  }

  // Función para mensajes de error amigables
  const getUserFriendlyError = (error) => {
    if (error.name === "AbortError") {
      return "El servidor tardó demasiado en responder. Por favor intenta nuevamente."
    }

    if (error.message.includes("Failed to fetch")) {
      return "No se pudo conectar al servidor. Verifica tu conexión a internet."
    }

    return error.message || "Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo."
  }

  // Manejo del envío de mensajes - Versión Optimizada
  const handleSendMessage = useCallback(
    async (e) => {
      e?.preventDefault()
      const trimmedMessage = message?.trim()
      if (!trimmedMessage) return

      // Mensaje del usuario con metadatos
      const userMessage = {
        text: trimmedMessage,
        sender: "user",
        timestamp: new Date().toISOString(),
        isComparison: comparisonMode,
      }

      // Actualización optimizada del estado
      setMessages((prev) => [...prev, userMessage])
      setMessage("")
      onMessageSent()

      try {
        const botResponse = await getBotResponse(trimmedMessage)

        setMessages((prev) => [
          ...prev,
          {
            ...botResponse,
            sender: "bot",
            timestamp: new Date().toISOString(),
            isHTML: true,
          },
        ])
      } catch (error) {
        console.error("Error en handleSendMessage:", error)
        setMessages((prev) => [
          ...prev,
          {
            text: `⚠️ Error crítico: ${error.message}`,
            sender: "bot",
            options: ["Reintentar", "Contactar soporte"],
            source: "error",
            timestamp: new Date().toISOString(),
          },
        ])
      } finally {
        scrollToBottom({ behavior: "smooth", force: true })
      }
    },
    [message, getBotResponse, onMessageSent, scrollToBottom, comparisonMode],
  )

  // Manejar opciones rápidas
  const handleQuickOption = useCallback(
    (option) => {
      if (option === "Cancelar comparación") {
        setComparisonMode(false)
        setMessages((prev) => [
          ...prev,
          {
            text: "Comparación cancelada. ¿En qué más puedo ayudarte?",
            sender: "bot",
            options: ["Ver opciones", "Ayuda"],
          },
        ])
        return
      }

      if (option === "Limpiar chat") {
        clearChat()
        return
      }

      setMessage(option)
      setTimeout(() => handleSendMessage({ preventDefault: () => {} }), 100)
    },
    [handleSendMessage, clearChat],
  )

  // Renderizado de mensajes
  const renderMessageContent = (msg) => {
    if (msg.isHTML) {
      return <p dangerouslySetInnerHTML={{ __html: msg.text }} />
    }

    // Formatear texto con saltos de línea si es una comparación
    if (msg.text.includes("|") && msg.text.includes("-")) {
      return (
        <div className="overflow-x-auto">
          <pre className="whitespace-pre-wrap font-sans text-sm">{msg.text}</pre>
        </div>
      )
    }

    return <p className="whitespace-pre-line">{msg.text}</p>
  }

  // NUEVO: Funciones para el arrastre del thumb
  const handleThumbMouseDown = useCallback((e) => {
    e.preventDefault()
    isDragging.current = true
    document.addEventListener("mousemove", handleThumbMouseMove)
    document.addEventListener("mouseup", handleThumbMouseUp)
  }, [])

  const handleThumbMouseMove = useCallback((e) => {
    if (!isDragging.current || !chatRef.current || !trackRef.current) return

    const { top, height } = trackRef.current.getBoundingClientRect()
    const { scrollHeight, clientHeight } = chatRef.current

    // Calcular la posición relativa del mouse en el track
    let relativePosition = (e.clientY - top) / height
    relativePosition = Math.max(0, Math.min(relativePosition, 1))

    // Calcular la posición de scroll correspondiente
    const scrollPosition = relativePosition * (scrollHeight - clientHeight)

    // Aplicar el scroll
    chatRef.current.scrollTop = scrollPosition
  }, [])

  const handleThumbMouseUp = useCallback(() => {
    isDragging.current = false
    document.removeEventListener("mousemove", handleThumbMouseMove)
    document.removeEventListener("mouseup", handleThumbMouseUp)
  }, [handleThumbMouseMove])

  // Manejar clic en la barra de scroll personalizada - MEJORADO
  const handleTrackClick = useCallback((e) => {
    if (!chatRef.current || !trackRef.current || e.target === thumbRef.current) return

    const { top, height } = trackRef.current.getBoundingClientRect()
    const { scrollHeight, clientHeight } = chatRef.current

    // Calcular la posición relativa del clic en el track
    const relativePosition = (e.clientY - top) / height

    // Calcular la posición de scroll correspondiente
    const scrollPosition = relativePosition * (scrollHeight - clientHeight)

    // Aplicar el scroll con animación
    chatRef.current.scrollTo({
      top: scrollPosition,
      behavior: "smooth",
    })
  }, [])

  // NUEVO: Manejar eventos táctiles para el scroll
  const handleTouchStart = useCallback((e) => {
    if (!chatRef.current) return
    const touch = e.touches[0]
    const startY = touch.clientY
    const startScrollTop = chatRef.current.scrollTop

    const handleTouchMove = (e) => {
      const touch = e.touches[0]
      const deltaY = startY - touch.clientY
      chatRef.current.scrollTop = startScrollTop + deltaY
    }

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }

    document.addEventListener("touchmove", handleTouchMove, { passive: true })
    document.addEventListener("touchend", handleTouchEnd)
  }, [])

  // Efecto para calcular el tamaño del thumb y observar cambios
  useEffect(() => {
    const currentChatRef = chatRef.current

    if (currentChatRef) {
      calculateThumbSize()

      const resizeObserver = new ResizeObserver(() => {
        calculateThumbSize()
        handleScroll()
      })

      resizeObserver.observe(currentChatRef)

      // Observar cambios en el contenido
      const mutationObserver = new MutationObserver(() => {
        calculateThumbSize()
        handleScroll()
      })

      mutationObserver.observe(currentChatRef, {
        childList: true,
        subtree: true,
        characterData: true,
      })

      return () => {
        resizeObserver.disconnect()
        mutationObserver.disconnect()
      }
    }
  }, [calculateThumbSize, handleScroll])

  // Mensaje inicial
  useEffect(() => {
    clearChat()
  }, [user?.name, clearChat])

  // Auto scroll al final de los mensajes
  useEffect(() => {
    scrollToBottom({ behavior: "auto" })
    // Recalcular el tamaño del thumb después de que se actualicen los mensajes
    setTimeout(calculateThumbSize, 100)
  }, [messages, scrollToBottom, calculateThumbSize])

  // Enfocar el input al abrir
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      // Limpiar los event listeners de arrastre
      document.removeEventListener("mousemove", handleThumbMouseMove)
      document.removeEventListener("mouseup", handleThumbMouseUp)
    }
  }, [handleThumbMouseMove, handleThumbMouseUp])

  // NUEVO: Manejar eventos de rueda del mouse para scroll suave
  const handleWheel = useCallback((e) => {
    if (!chatRef.current) return

    // Prevenir el comportamiento predeterminado para tener control total
    e.preventDefault()

    // Calcular la cantidad de scroll basada en el evento de rueda
    const scrollAmount = e.deltaY * 0.5 // Ajustar la sensibilidad

    // Aplicar el scroll
    chatRef.current.scrollTop += scrollAmount
  }, [])

  // Agregar y eliminar el event listener de rueda
  useEffect(() => {
    const currentChatRef = chatRef.current

    if (currentChatRef) {
      currentChatRef.addEventListener("wheel", handleWheel, { passive: false })

      return () => {
        currentChatRef.removeEventListener("wheel", handleWheel)
      }
    }
  }, [handleWheel])

  // NUEVO: Prevenir que el contenido se desborde
  useEffect(() => {
    const handleResize = () => {
      if (chatContainerRef.current) {
        const windowHeight = window.innerHeight
        const maxHeight = windowHeight * 0.8 // Limitar al 80% de la altura de la ventana
        chatContainerRef.current.style.maxHeight = `${maxHeight}px`
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <motion.div
      ref={chatContainerRef}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="w-full h-full flex flex-col bg-white rounded-xl shadow-xl overflow-hidden relative"
      style={{ maxWidth: "400px", maxHeight: "600px" }}
    >
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-xl flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
            <FiShoppingCart className="text-white" />
          </div>
          <div>
            <h4 className="font-bold">Asistente de Smartphones</h4>
            <p className="text-xs text-blue-100">En línea</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white hover:text-blue-200 ml-2">
          <FiX />
        </button>
      </div>

      {/* Botones de desplazamiento */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollButtons ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute right-8 top-16 flex flex-col gap-2 z-10"
      >
        <button
          onClick={scrollToTop}
          className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md flex items-center justify-center transition-all hover:shadow-lg"
          title="Ir al inicio"
        >
          <FiChevronUp size={16} />
        </button>
        <button
          onClick={() => scrollToBottom({ behavior: "smooth", force: true })}
          className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md flex items-center justify-center transition-all hover:shadow-lg"
          title="Ir al final"
        >
          <FiChevronDown size={16} />
        </button>
      </motion.div>

      {/* Cuerpo del chat con barra de scroll personalizada */}
      <div className="flex-1 overflow-hidden p-4 bg-gray-50 relative">
        <div
          ref={chatRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          className="h-full pr-6 overflow-y-auto scroll-container"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch", // Para scroll suave en iOS
          }}
        >
          <style jsx global>{`
            .scroll-container::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <div className="space-y-3">
            {(messages || []).map((msg, index) => (
              <div key={`msg-${index}`} className={`flex ${msg?.sender === "user" ? "justify-end" : "justify-start"}`}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-xl p-3 max-w-[85%] ${
                    msg?.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : msg?.source === "error"
                        ? "bg-red-100 text-red-800 rounded-bl-none"
                        : msg?.source === "database"
                          ? "bg-green-50 text-gray-800 border border-green-100 rounded-bl-none"
                          : "bg-white text-gray-800 rounded-bl-none shadow-sm"
                  }`}
                >
                  {renderMessageContent(msg)}

                  <div className="flex flex-wrap gap-2 mt-2">
                    {(msg?.options || []).map((option, i) => (
                      <button
                        key={`opt-${i}`}
                        onClick={() => handleQuickOption(option)}
                        className={`text-xs px-3 py-1 rounded-full transition-colors ${
                          option === "Cancelar comparación"
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            ))}

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
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 0.8,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                    <span className="ml-2 text-xs text-gray-500">escribiendo...</span>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Barra de scroll personalizada - MEJORADA */}
        <div
          ref={trackRef}
          className="absolute right-2 top-0 bottom-0 w-2 bg-gray-200 rounded-full cursor-pointer"
          onClick={handleTrackClick}
        >
          <div
            ref={thumbRef}
            className="absolute right-0 w-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors cursor-grab active:cursor-grabbing"
            style={{
              height: `${thumbHeight}px`,
              top: `${scrollPosition}px`,
            }}
            onMouseDown={handleThumbMouseDown}
          />
        </div>
      </div>

      {/* Input para enviar mensajes */}
      <div className="p-4 border-t border-gray-200 bg-white relative flex-shrink-0">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex gap-2">
          <button
            onClick={clearChat}
            className="text-gray-500 hover:text-blue-600 transition-colors"
            title="Limpiar chat"
          >
            <FiTrash2 size={18} />
          </button>
          {comparisonMode && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full" title="Modo comparación activo">
              VS
            </span>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="relative ml-12">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e?.target?.value || "")}
            placeholder={comparisonMode ? "Escribe los modelos a comparar..." : "Escribe tu mensaje..."}
            className="w-full px-4 py-3 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
              message.trim() ? "text-blue-600 hover:text-blue-800" : "text-gray-400"
            }`}
          >
            <FiArrowRight />
          </button>
        </form>
      </div>
    </motion.div>
  )
}

Chatbot.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
  }),
  onClose: PropTypes.func,
  onMessageSent: PropTypes.func,
}

export default Chatbot
