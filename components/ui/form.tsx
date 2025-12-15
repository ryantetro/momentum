"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { Label } from "./label"
import { cn } from "@/lib/utils"

const FormContext = React.createContext<{
  errors: Record<string, any>
}>({ errors: {} })

export function FormProvider({
  children,
  errors,
}: {
  children: React.ReactNode
  errors?: Record<string, any>
}) {
  return (
    <FormContext.Provider value={{ errors: errors || {} }}>
      {children}
    </FormContext.Provider>
  )
}

export function useFormField() {
  const { errors } = React.useContext(FormContext)
  return { errors }
}

const Form = React.forwardRef<
  HTMLFormElement,
  React.FormHTMLAttributes<HTMLFormElement>
>(({ className, ...props }, ref) => {
  return <form ref={ref} className={cn("space-y-4", className)} {...props} />
})
Form.displayName = "Form"

const FormField = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
  name: string
}
>(({ className, name, children, ...props }, ref) => {
  const { errors } = useFormField()
  const error = errors[name]
  
  return (
    <div ref={ref} className={cn("space-y-2", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { error })
        }
        return child
      })}
    </div>
  )
})
FormField.displayName = "FormField"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  return <Label ref={ref} className={cn(className)} {...props} />
})
FormLabel.displayName = "FormLabel"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export { Form, FormField, FormLabel, FormMessage }

