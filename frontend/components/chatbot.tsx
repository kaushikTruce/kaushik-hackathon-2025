"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { UseFormRegister, FieldErrors } from "react-hook-form"

interface ChatbotProps {
  onSubmit: () => void
  register: UseFormRegister<any>
  errors: FieldErrors
  isUploading: boolean
  uploadProgress: number
}

export function Chatbot({ onSubmit, register, errors, isUploading, uploadProgress }: ChatbotProps) {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
    {
      text: "Hello! I'm your data visualization assistant. Please describe what insights you're looking for in your data.",
      isUser: false,
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() === "") return

    // Add user message
    setMessages([...messages, { text: inputValue, isUser: true }])

    // Clear input
    setInputValue("")

    // Trigger the form submission
    onSubmit()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-lg border bg-card shadow-sm overflow-hidden"
    >
      <div className="flex flex-col h-[400px]">
        <div className="bg-purple-600 text-white p-3">
          <h3 className="font-medium">Data Visualization Assistant</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.isUser
                      ? "bg-purple-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {message.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t p-3">
          <div className="relative">
            <Textarea
              placeholder="Describe what insights you're looking for..."
              className="min-h-[100px] p-4 text-base border-gray-200 focus-visible:ring-purple-400 shadow-sm transition-all duration-300 resize-none"
              {...register("prompt", {
                required: "Prompt is required",
              })}
              value={inputValue}
              onChange={handleInputChange}
              disabled={isUploading}
            />
            {errors.prompt && <p className="text-sm text-red-500 mt-1">{errors.prompt.message as string}</p>}

            {isUploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-md">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                    className="inline-block"
                  >
                    <RefreshCw className="h-8 w-8 text-purple-500" />
                  </motion.div>
                  <p className="mt-2 text-sm font-medium text-gray-700">Processing...</p>
                </div>
              </div>
            )}
          </div>

          {isUploading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 mt-3">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Processing file...</span>
                <span>{uploadProgress > 0 ? `${uploadProgress}%` : ""}</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </motion.div>
          )}

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="mt-3"
          >
            <Button
              type="submit"
              className="w-full py-2 font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300"
              disabled={isUploading || inputValue.trim() === ""}
            >
              <motion.span
                animate={
                  isUploading
                    ? {}
                    : {
                        scale: [1, 1.03, 1],
                        transition: {
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 2,
                          repeatType: "reverse",
                        },
                      }
                }
              >
                {isUploading ? "Processing..." : "Send"}
              </motion.span>
            </Button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  )
}
