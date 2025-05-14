"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, BarChart, BarChart2, MessageSquare, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SparklesCore } from "@/components/ui/sparkles"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { TypewriterEffect } from "@/components/ui/typewriter-effect"

export default function Home() {
  const [isHovered, setIsHovered] = useState(false)

  const words = [
    {
      text: "Transform",
    },
    {
      text: "your",
    },
    {
      text: "data",
    },
    {
      text: "with",
    },
    {
      text: "Vizionary",
      className: "text-blue-500 dark:text-blue-500",
    },
    {
      text: ".",
    },
  ]

  const features = [
    {
      title: "Upload CSV",
      description: "Easily upload your CSV files with a simple drag and drop interface.",
      icon: <Upload className="h-10 w-10 text-purple-500" />,
    },
    {
      title: "Describe Your Needs",
      description: "Tell our AI what insights you're looking for in natural language.",
      icon: <MessageSquare className="h-10 w-10 text-purple-500" />,
    },
    {
      title: "Get Beautiful Visualizations",
      description: "Instantly receive professionally designed, interactive charts and graphs.",
      icon: <BarChart className="h-10 w-10 text-purple-500" />,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex h-[80vh] w-full flex-col items-center justify-center overflow-hidden rounded-md">
        <div className="z-10 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 flex items-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-blue-500 p-2">
              <motion.div
                className="absolute inset-0 flex items-center justify-center text-white"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 1 }}
              >
                <BarChart2 className="h-8 w-8" />
              </motion.div>
            </div>
            <h1 className="ml-4 text-4xl font-bold">Vizionary</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10"
          >
            <TypewriterEffect words={words} className="text-center text-4xl font-bold" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-10 max-w-lg text-center text-lg text-gray-600 dark:text-gray-400"
            whileHover={{ scale: 1.02, color: "#4a5568" }}
          >
            Upload your CSV data and get beautiful, interactive visualizations with just a few clicks. Powered by AI to
            make data visualization simple and intuitive.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/dashboard">
              <Button
                size="lg"
                className="group relative overflow-hidden rounded-full bg-blue-500 px-8 py-6 text-lg font-bold text-white transition-all duration-300 hover:bg-blue-600"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                Get Started
                <ArrowRight
                  className={`ml-2 inline-block transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`}
                />
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className="absolute inset-0 z-0">
          <SparklesCore
            id="tsparticlesfullpage"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={70}
            particleColor="#4299e1"
            speed={1}
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-12 text-center text-3xl font-bold"
            whileHover={{ scale: 1.02, color: "#4a5568" }}
          >
            Powerful Visualization Features
          </motion.h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  y: -5,
                }}
              >
                <Card className="overflow-hidden transition-all duration-300 hover:border-purple-300">
                  <CardContent className="p-6">
                    <motion.div
                      className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 1 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="container relative z-10 mx-auto px-4">
          <div className="rounded-lg bg-blue-50 p-12 dark:bg-blue-900/20 transition-all duration-300 hover:shadow-lg">
            <div className="mx-auto max-w-3xl text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="mb-6 text-3xl font-bold"
                whileHover={{ scale: 1.02, color: "#4a5568" }}
              >
                Ready to visualize your data?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="mb-8 text-lg text-gray-600 dark:text-gray-400"
                whileHover={{ scale: 1.02 }}
              >
                Start creating beautiful, interactive visualizations in minutes. No coding required.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="bg-blue-500 px-8 py-6 text-lg font-bold hover:bg-blue-600 transition-all duration-300"
                  >
                    Try Vizionary Now
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
        <BackgroundBeams />
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <motion.div className="mb-6 flex items-center md:mb-0" whileHover={{ scale: 1.05 }}>
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-blue-500 p-2">
                <motion.div
                  className="absolute inset-0 flex items-center justify-center text-white"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 1 }}
                >
                  <BarChart2 className="h-5 w-5" />
                </motion.div>
              </div>
              <span className="ml-2 text-xl font-bold">Vizionary</span>
            </motion.div>
            <motion.div
              className="text-center text-sm text-gray-600 dark:text-gray-400 md:text-right"
              whileHover={{ scale: 1.05, color: "#4a5568" }}
            >
              &copy; {new Date().getFullYear()} Vizionary. All rights reserved.
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  )
}
