"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { Toast } from "./toast"

interface ToastContextType {
  toast: (props: { title?: string; description?: string; variant?: "default" | "destructive" }) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Separate provider component that wraps the app
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: string; title?: string; description?: string; variant?: "default" | "destructive" }>>([])

  const addToast = useCallback((props: { title?: string; description?: string; variant?: "default" | "destructive" }) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, ...props }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
        {toasts.map((toast) => (
          <div key={toast.id} className="mb-2 animate-in slide-in-from-bottom-5">
            <Toast {...toast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Toaster component for backward compatibility (just renders the provider)
export function Toaster() {
  return null
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}

