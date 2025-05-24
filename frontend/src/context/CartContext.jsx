"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"

const CartContext = createContext(null)
const API_BASE_URL = "http://localhost:8000"
const CART_API_URL = `${API_BASE_URL}/carrito/api`

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart debe ser usado dentro de un CartProvider")
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [updatingItemId, setUpdatingItemId] = useState(null)
  const [notification, setNotification] = useState(null)

  const showNotification = (message, type = "error") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const makeRequest = useCallback(async (endpoint, method = "GET", body = null) => {
    try {
      // Construcción robusta de URL
      const url = new URL(`${CART_API_URL}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1"))
      
      // Configuración de headers
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }

      // Añadir token de autenticación si existe
      const token = localStorage.getItem("token")
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Configuración completa de la petición
      const config = {
        method,
        headers: new Headers(headers),
        credentials: "include",
        mode: "cors"
      }

      // Añadir body para métodos POST/PUT/PATCH
      if (body && ["POST", "PUT", "PATCH"].includes(method)) {
        config.body = JSON.stringify(body)
      }

      // Sistema de timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      config.signal = controller.signal

      // Realizar la petición
      const response = await fetch(url, config)
      clearTimeout(timeoutId)

      // Manejar respuestas no exitosas
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Error ${response.status}: ${response.statusText}`
        }))
        throw new Error(errorData.message || errorData.mensaje || "Error en la solicitud")
      }

      // Retornar datos parseados
      return await response.json()

    } catch (caughtError) {
      // 1. Asegurar que tenemos un objeto Error válido
      const error = caughtError instanceof Error ? caughtError : new Error(String(caughtError))

      // 2. Logging seguro
      const safeLog = (...args) => {
        try {
          if (typeof console !== 'undefined' && console.error) {
            console.error(...args)
          }
        } catch (e) {}
      }

      // 3. Log detallado
      safeLog(`Error en ${method} ${endpoint}:`, {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      })

      // 4. Clasificación de errores
      const errorMap = {
        AbortError: "La solicitud tardó demasiado. Por favor intenta nuevamente",
        TypeError: "Error en los datos de la solicitud",
        SyntaxError: "Error al procesar la respuesta",
        default: error.message || "Ocurrió un error inesperado"
      }

      // 5. Mensaje amigable
      const friendlyMessage = errorMap[error.name] || errorMap.default

      // 6. Crear nuevo error con metadata
      const apiError = new Error(friendlyMessage)
      apiError.isApiError = true
      apiError.originalError = error
      apiError.timestamp = new Date().toISOString()

      throw apiError
    }
  }, [])

  const fetchCart = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await makeRequest("ver")
      const items = data.carrito || []
      setCartItems(items)
      
      // Backup local solo si no hay datos del servidor
      if (items.length === 0) {
        const backup = localStorage.getItem("cart_backup")
        if (backup) {
          try {
            const parsedBackup = JSON.parse(backup)
            setCartItems(parsedBackup)
          } catch (e) {
            safeLog("Error parsing backup:", e)
            localStorage.removeItem("cart_backup")
          }
        }
      }
    } catch (err) {
      setError(err.message)
      showNotification(err.message || "Error al cargar el carrito")
    } finally {
      setLoading(false)
    }
  }, [makeRequest])

  // Efecto para cargar el carrito al montar el componente
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // Persistencia local
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem("cart_backup", JSON.stringify(cartItems))
    } else {
      localStorage.removeItem("cart_backup")
    }
  }, [cartItems])

  const addToCart = useCallback(async (productId, quantity = 1) => {
    setUpdatingItemId(productId)
    try {
      const data = await makeRequest("agregar", "POST", {
        producto_id: productId,
        cantidad: quantity
      })
      setCartItems(data.carrito || [])
      showNotification("Producto agregado al carrito", "success")
      return data
    } catch (err) {
      setError(err.message)
      showNotification(err.message || "Error al agregar producto")
      throw err
    } finally {
      setUpdatingItemId(null)
    }
  }, [makeRequest])

  const removeFromCart = useCallback(async (productId) => {
    setUpdatingItemId(productId)
    try {
      const data = await makeRequest(`eliminar/${productId}`, "DELETE")
      setCartItems(data.carrito || [])
      showNotification("Producto eliminado del carrito", "success")
      return data
    } catch (err) {
      setError(err.message)
      showNotification(err.message || "Error al eliminar producto")
      throw err
    } finally {
      setUpdatingItemId(null)
    }
  }, [makeRequest])

  const updateItemQuantity = useCallback(async (productId, newQuantity) => {
    setUpdatingItemId(productId)
    try {
      const data = await makeRequest(`actualizar/${productId}`, "PUT", {
        cantidad: newQuantity
      })
      setCartItems(data.carrito || [])
      showNotification("Cantidad actualizada", "success")
      return data
    } catch (err) {
      setError(err.message)
      showNotification(err.message || "Error al actualizar cantidad")
      throw err
    } finally {
      setUpdatingItemId(null)
    }
  }, [makeRequest])

  const clearCart = useCallback(async () => {
    try {
      const data = await makeRequest("vaciar", "POST")
      setCartItems([])
      localStorage.removeItem("cart_backup")
      showNotification("Carrito vaciado", "success")
      return data
    } catch (err) {
      setError(err.message)
      showNotification(err.message || "Error al vaciar carrito")
      throw err
    }
  }, [makeRequest])

  // Memoized calculations
  const cartTotal = useMemo(() => (
    cartItems.reduce((total, item) => {
      const price = item.producto?.precio || 0
      const quantity = item.cantidad || 0
      return total + (price * quantity)
    }, 0)
  ), [cartItems])

  const itemCount = useMemo(() => (
    cartItems.reduce((count, item) => count + (item.cantidad || 0), 0)
  ), [cartItems])

  // Context value
  const value = useMemo(() => ({
    cartItems,
    cartTotal: parseFloat(cartTotal.toFixed(2)),
    itemCount,
    loading,
    error,
    updatingItemId,
    notification,
    isInCart: (productId) => cartItems.some(item => item.producto?.id === productId),
    getItemQuantity: (productId) => {
      const item = cartItems.find(item => item.producto?.id === productId)
      return item ? item.cantidad : 0
    },
    addToCart,
    removeFromCart,
    clearCart,
    updateItemQuantity,
    refreshCart: fetchCart,
    dismissNotification: () => setNotification(null)
  }), [
    cartItems,
    cartTotal,
    itemCount,
    loading,
    error,
    updatingItemId,
    notification,
    addToCart,
    removeFromCart,
    clearCart,
    updateItemQuantity,
    fetchCart
  ])

  return (
    <CartContext.Provider value={value}>
      {children}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${
          notification.type === "error" ? "bg-red-500" : "bg-green-500"
        } text-white flex items-center`}>
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification(null)} 
            className="ml-2 font-bold hover:text-gray-200"
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      )}
    </CartContext.Provider>
  )
}