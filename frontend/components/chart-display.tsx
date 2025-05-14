"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Text, Environment, Float, Sparkles } from "@react-three/drei"
import { easing } from "maath"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Bar, Line, Pie, Radar } from "react-chartjs-2"
import { Loader } from "lucide-react"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
)

interface ResultItem {
  [key: string]: string | number
}

interface ChartDisplayProps {
  resultData: ResultItem[] | null
  labelKey: string | null
  dataKey: string | null
}

interface ChartDataItem {
  label: string
  value: number
  color: THREE.Color | string
  normalizedValue: number
}

interface ChartComponentProps {
  data: ChartDataItem[]
  hoveredIndex: number | null
  setHoveredIndex: (index: number | null) => void
  labelKey: string
  dataKey: string
}

// 3D rotation angle in degrees - can be adjusted as needed
const ROTATION_ANGLE = 10 * (Math.PI / 180) // Convert to radians

// Generate a beautiful color palette
const generateColorPalette = (count: number) => {
  const baseColors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#0088fe",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#a4de6c",
    "#d0ed57",
    "#8dd1e1",
    "#83a6ed",
    "#8884d8",
    "#c49c94",
    "#e377c2",
  ]

  // If we need more colors than in our base palette, generate them
  if (count <= baseColors.length) {
    return baseColors.slice(0, count)
  }

  // Generate additional colors with slight variations
  const colors = [...baseColors]
  for (let i = baseColors.length; i < count; i++) {
    const r = Math.floor(Math.random() * 200 + 55)
    const g = Math.floor(Math.random() * 200 + 55)
    const b = Math.floor(Math.random() * 200 + 55)
    colors.push(`rgb(${r}, ${g}, ${b})`)
  }

  return colors
}

// Format large numbers for better readability
const formatNumber = (value: number) => {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + "B"
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M"
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + "K"
  }
  return value.toString()
}

export function ChartDisplay({ resultData, labelKey, dataKey }: ChartDisplayProps) {
  const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "radar">("bar")
  const [chartData, setChartData] = useState<any[] | null>(null)
  const [maxValue, setMaxValue] = useState<number>(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [use3D, setUse3D] = useState<boolean>(false) // Default to 2D for better compatibility
  const [webGLError, setWebGLError] = useState<boolean>(false)
  const [colorPalette, setColorPalette] = useState<string[]>([])
  const [chartError, setChartError] = useState<string | null>(null)

  useEffect(() => {
    // Check if WebGL is available
    try {
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      if (!gl) {
        setUse3D(false)
        setWebGLError(true)
      }
    } catch (e) {
      setUse3D(false)
      setWebGLError(true)
    }

    // Handle WebGL context loss
    const handleContextLoss = () => {
      console.warn("WebGL context lost. Falling back to 2D charts.")
      setUse3D(false)
      setWebGLError(true)
    }

    window.addEventListener("webglcontextlost", handleContextLoss)

    return () => {
      window.removeEventListener("webglcontextlost", handleContextLoss)
    }
  }, [])

  useEffect(() => {
    if (!resultData || !labelKey || !dataKey) {
      setChartData(null)
      return
    }

    try {
      const labels = resultData.map((item) => String(item[labelKey] ?? "N/A"))
      const dataValues = resultData.map((item) => {
        const value = item[dataKey]
        // Convert string numbers to actual numbers
        return typeof value === "string" ? Number(value) : Number(value ?? 0)
      })

      // Check if we have valid data
      if (dataValues.some(isNaN)) {
        throw new Error("Some data values are not valid numbers")
      }

      const maxVal = Math.max(...dataValues)
      setMaxValue(maxVal)

      // Generate a color palette for the data points
      const colors = generateColorPalette(resultData.length)
      setColorPalette(colors)

      const formattedData = labels.map((label, index) => ({
        label,
        value: dataValues[index],
        color: colors[index],
        normalizedValue: dataValues[index] / maxVal,
        // Add properties for Chart.js
        name: label,
        [dataKey]: dataValues[index],
        fullValue: dataValues[index], // Keep the full value for tooltips
      }))

      setChartData(formattedData)
      setChartError(null)
    } catch (error) {
      console.error("Error processing chart data:", error)
      setChartError(`Error processing chart data: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }, [resultData, labelKey, dataKey])

  if (!resultData || !labelKey || !dataKey) {
    return (
      <Card className="p-6 h-full flex items-center justify-center shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Select Chart Data</h3>
          <p className="text-gray-500">Please select both a label column and a data column to visualize your data.</p>
        </div>
      </Card>
    )
  }

  if (chartError) {
    return (
      <Card className="p-6 h-full flex items-center justify-center shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">Chart Error</h3>
          <p className="text-gray-700">{chartError}</p>
          <p className="text-gray-500 mt-2">Please try selecting different columns or check your data format.</p>
        </div>
      </Card>
    )
  }

  // If WebGL is not available or there was an error, use 2D charts with Chart.js
  if (!use3D || webGLError) {
    // Prepare data for Chart.js
    const chartJsData = {
      labels: chartData?.map((item) => item.label) || [],
      datasets: [
        {
          label: dataKey,
          data: chartData?.map((item) => item.value) || [],
          backgroundColor: chartData?.map((_, index) => colorPalette[index % colorPalette.length]) || [],
          borderColor: chartData?.map((_, index) => colorPalette[index % colorPalette.length]) || [],
          borderWidth: 1,
          hoverBackgroundColor:
            chartData?.map((_, index) =>
              hoveredIndex === index
                ? `${colorPalette[index % colorPalette.length]}CC`
                : `${colorPalette[index % colorPalette.length]}99`,
            ) || [],
          hoverBorderColor:
            chartData?.map((_, index) =>
              hoveredIndex === index ? "#333" : colorPalette[index % colorPalette.length],
            ) || [],
          hoverBorderWidth: chartData?.map((_, index) => (hoveredIndex === index ? 2 : 1)) || [],
          fill: chartType === "radar" ? "origin" : false,
          tension: 0.2, // Smooth lines
        },
      ],
    }

    // Chart.js options
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: {
          display: true,
          position: "top" as const,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || ""
              if (label) {
                label += ": "
              }
              let value
              if (chartType === "pie" || chartType === "radar") {
                value = context.raw // For pie/radar charts, the value is in context.raw
              } else {
                value = context.parsed.y // For bar/line charts, it's in context.parsed.y
              }

              if (value !== undefined && value !== null) {
                label += formatNumber(value)
              } else {
                label += "N/A"
              }
              return label
            },
          },
        },
      },
      scales:
        chartType !== "pie" && chartType !== "radar"
          ? {
              x: {
                ticks: {
                  maxRotation: 45,
                  minRotation: 45,
                },
              },
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value: any) => formatNumber(value),
                },
              },
            }
          : undefined,
      elements: {
        point: {
          radius: 4,
          hoverRadius: 6,
        },
        line: {
          tension: 0.4, // Smooth lines
        },
      },
      onHover: (_: any, elements: any[]) => {
        if (elements && elements.length > 0) {
          setHoveredIndex(elements[0].index)
        } else {
          setHoveredIndex(null)
        }
      },
    }

    // Radar specific options
    const radarOptions = {
      ...chartOptions,
      scales: {
        r: {
          beginAtZero: true,
          ticks: {
            callback: (value: any) => formatNumber(value),
            backdropColor: "transparent", // Add this to make values visible
            z: 10, // Add this to increase z-index
          },
          pointLabels: {
            font: {
              size: 10,
            },
            padding: 10, // Add padding to move labels outward
          },
        },
      },
    }

    return (
      <Card className="p-6 h-full shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="h-full flex flex-col"
        >
          <div className="mb-4 flex justify-between items-center">
            <Tabs defaultValue="bar" onValueChange={(value) => setChartType(value as any)}>
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="bar" className="transition-all duration-200 hover:bg-purple-100">
                  Bar
                </TabsTrigger>
                <TabsTrigger value="line" className="transition-all duration-200 hover:bg-purple-100">
                  Line
                </TabsTrigger>
                <TabsTrigger value="pie" className="transition-all duration-200 hover:bg-purple-100">
                  Pie
                </TabsTrigger>
                <TabsTrigger value="radar" className="transition-all duration-200 hover:bg-purple-100">
                  Radar
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {webGLError ? (
              <div className="text-amber-600 text-xs">3D rendering not available</div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(168, 85, 247, 0.2)" }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1 rounded-md bg-purple-100 text-purple-700 text-sm font-medium transition-all duration-200"
                onClick={() => setUse3D(true)}
              >
                Try 3D
              </motion.button>
            )}
          </div>

          <motion.div
            key={chartType}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex-1 min-h-[400px] relative rounded-xl overflow-hidden bg-white p-4"
            style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={chartType}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 p-4"
              >
                {chartData ? (
                  <div className="w-full h-full">
                    {chartType === "bar" && <Bar data={chartJsData} options={chartOptions} />}
                    {chartType === "line" && <Line data={chartJsData} options={chartOptions} />}
                    {chartType === "pie" && <Pie data={chartJsData} options={chartOptions} />}
                    {chartType === "radar" && <Radar data={chartJsData} options={radarOptions} />}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader className="h-8 w-8 animate-spin text-purple-600" />
                      <p className="text-sm text-gray-500">Loading chart data...</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Legend */}
          {chartData && chartData.length > 0 && chartType !== "pie" && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {chartData.map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/50 backdrop-blur-sm"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.8)" }}
                  onHoverStart={() => setHoveredIndex(index)}
                  onHoverEnd={() => setHoveredIndex(null)}
                >
                  <div
                    className="w-3 h-3 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: colorPalette[index % colorPalette.length],
                      boxShadow: hoveredIndex === index ? "0 0 5px 2px rgba(139, 92, 246, 0.5)" : "none",
                      transform: hoveredIndex === index ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                  <span className="text-xs font-medium truncate max-w-[100px]">{item.label}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* 3D Toggle Button */}
          {!webGLError && (
            <div className="mt-4 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium shadow-md transition-all duration-200"
                onClick={() => setUse3D(true)}
              >
                Try 3D Visualization
              </motion.button>
            </div>
          )}
        </motion.div>
      </Card>
    )
  }

  // 3D chart rendering
  return (
    <Card className="p-6 h-full shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full flex flex-col"
      >
        <div className="mb-4 flex justify-between items-center">
          <Tabs defaultValue="bar" onValueChange={(value) => setChartType(value as "bar" | "line")}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="bar" className="transition-all duration-200 hover:bg-purple-100">
                3D Bar Chart
              </TabsTrigger>
              <TabsTrigger value="line" className="transition-all duration-200 hover:bg-purple-100">
                3D Line Chart
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(168, 85, 247, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1 rounded-md bg-purple-100 text-purple-700 text-sm font-medium transition-all duration-200"
            onClick={() => setUse3D(false)}
          >
            Switch to 2D
          </motion.button>
        </div>

        <motion.div
          key={chartType}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 min-h-[400px] relative rounded-xl overflow-hidden"
          style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={chartType}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, -10, -10]} color="blue" intensity={0.5} />

                <Sparkles count={200} scale={20} size={2} speed={0.3} opacity={0.2} />
                <Environment preset="city" />

                <OrbitControls enableZoom={true} autoRotate={false} maxDistance={30} minDistance={5} />

                {chartData && (
                  <>
                    {chartType === "bar" && (
                      <BarChart3D
                        data={chartData}
                        hoveredIndex={hoveredIndex}
                        setHoveredIndex={setHoveredIndex}
                        labelKey={labelKey}
                        dataKey={dataKey}
                      />
                    )}
                    {chartType === "line" && (
                      <LineChart3D
                        data={chartData}
                        hoveredIndex={hoveredIndex}
                        setHoveredIndex={setHoveredIndex}
                        labelKey={labelKey}
                        dataKey={dataKey}
                      />
                    )}
                  </>
                )}
              </Canvas>
            </motion.div>
          </AnimatePresence>

          {/* Tooltip overlay */}
          {hoveredIndex !== null && chartData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-purple-200 z-10 text-sm"
              style={{
                top: "10px",
                right: "10px",
                minWidth: "150px",
              }}
            >
              <div className="font-bold text-gray-800">{chartData[hoveredIndex].label}</div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">{dataKey}:</span>
                <span className="font-medium text-purple-700">{chartData[hoveredIndex].value.toLocaleString()}</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Legend */}
        {chartData && chartData.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {chartData.map((item, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/50 backdrop-blur-sm"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.8)" }}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
              >
                <div
                  className="w-3 h-3 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor:
                      typeof item.color === "string"
                        ? item.color
                        : `rgb(${item.color.r * 255}, ${item.color.g * 255}, ${item.color.b * 255})`,
                    boxShadow: hoveredIndex === index ? "0 0 5px 2px rgba(139, 92, 246, 0.5)" : "none",
                    transform: hoveredIndex === index ? "scale(1.2)" : "scale(1)",
                  }}
                />
                <span className="text-xs font-medium truncate max-w-[100px]">{item.label}</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </Card>
  )
}

// Update the 3D chart components to use fixed rotation
function BarChart3D({ data, hoveredIndex, setHoveredIndex, labelKey, dataKey }: ChartComponentProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { viewport } = useThree()
  const barWidth = 0.8
  const spacing = 0.3
  const totalWidth = data.length * (barWidth + spacing) - spacing
  const startX = -totalWidth / 2 + barWidth / 2

  // Set fixed rotation instead of animating
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = ROTATION_ANGLE
      groupRef.current.rotation.x = -10 * (Math.PI / 180);
    }
  }, [])

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      {/* Base platform */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[totalWidth + 2, 8]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Chart title */}
      <Text position={[0, 6, 0]} fontSize={0.8} color="#1e293b" anchorX="center" anchorY="middle">
        {`${dataKey} by ${labelKey}`}
      </Text>

      {/* Y-axis */}
      <group position={[startX - 1.5, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.05, 6, 0.05]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>

        {/* Y-axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
          <group key={i} position={[0, tick * 5, 0]}>
            <mesh position={[-0.2, 0, 0]}>
              <boxGeometry args={[0.4, 0.02, 0.02]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <Text position={[-0.6, 0, 0]} fontSize={0.3} color="#64748b" anchorX="right" anchorY="middle">
              {formatNumber(Math.round(tick * Math.max(...data.map((d) => d.value))))}
            </Text>
          </group>
        ))}
      </group>

      {/* X-axis */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[totalWidth + 2, 0.05, 0.05]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      {/* Bars */}
      {data.map((item, index) => {
        const x = startX + index * (barWidth + spacing)
        const height = Math.max(item.normalizedValue * 5, 0.1) // Minimum height for visibility
        const isHovered = hoveredIndex === index

        return (
          <group key={index} position={[x, 0, 0]}>
            <Float speed={2} rotationIntensity={0} floatIntensity={isHovered ? 0.5 : 0} floatingRange={[0, 0.2]}>
              {/* Bar */}
              <mesh
                position={[0, height / 2, 0]}
                scale={isHovered ? 1.1 : 1}
                onPointerOver={() => setHoveredIndex(index)}
                onPointerOut={() => setHoveredIndex(null)}
              >
                <boxGeometry args={[barWidth, height, barWidth]} />
                <meshStandardMaterial
                  color={item.color}
                  metalness={0.6}
                  roughness={0.1}
                  emissive={isHovered ? item.color : "#000000"}
                  emissiveIntensity={isHovered ? 0.5 : 0}
                />
              </mesh>

              {/* Value label */}
              {isHovered && (
                <Text position={[0, height + 0.5, 0]} fontSize={0.4} color="#1e293b" anchorX="center" anchorY="middle">
                  {formatNumber(item.value)}
                </Text>
              )}
            </Float>

            {/* X-axis label */}
            <Text
              position={[0, -0.5, 0.2]}
              fontSize={0.3}
              color="#64748b"
              maxWidth={1.5}
              anchorX="center"
              anchorY="top"
              rotation={[0, 0, Math.PI / 4]}
            >
              {item.label.length > 10 ? item.label.substring(0, 10) + "..." : item.label}
            </Text>
          </group>
        )
      })}
    </group>
  )
}

// 3D Line Chart Component
function LineChart3D({ data, hoveredIndex, setHoveredIndex, labelKey, dataKey }: ChartComponentProps) {
  const groupRef = useRef<THREE.Group>(null)
  const lineRef = useRef<THREE.Line>(null)
  const pointsRef = useRef<(THREE.Mesh | null)[]>([])

  const totalWidth = 10
  const startX = -totalWidth / 2
  const spacing = totalWidth / (data.length - 1 || 1)

  // Set fixed rotation instead of animating
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = ROTATION_ANGLE
      groupRef.current.rotation.x = -10 * (Math.PI / 180);
    }
  }, [])

  // Update line geometry and animate points on hover
  useFrame((state, delta) => {
    // Animate points on hover
    pointsRef.current.forEach((point, index) => {
      if (point && hoveredIndex === index) {
        easing.damp3(point.position, [startX + index * spacing, data[index].normalizedValue * 5, 0], 0.2, delta)
        easing.damp3(point.scale, [1.5, 1.5, 1.5], 0.2, delta)
      } else if (point) {
        easing.damp3(point.position, [startX + index * spacing, data[index].normalizedValue * 5, 0], 0.2, delta)
        easing.damp3(point.scale, [1, 1, 1], 0.2, delta)
      }
    })

    // Update line geometry
    if (lineRef.current && pointsRef.current.length > 0) {
      const positions = pointsRef.current
        .filter((point): point is THREE.Mesh => point !== null)
        .map((point) => point.position)
      const curve = new THREE.CatmullRomCurve3(positions)
      const points = curve.getPoints(50)
      lineRef.current.geometry.setFromPoints(points)
    }
  })

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      {/* Base platform */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[totalWidth + 2, 8]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.2} roughness={0.8} transparent={true} opacity={0.1}/>
      </mesh>

      {/* Chart title */}
      <Text position={[0, 6, 0]} fontSize={0.8} color="#1e293b" anchorX="center" anchorY="middle">
        {`${dataKey} by ${labelKey}`}
      </Text>

      {/* Y-axis */}
      <group position={[startX - 1, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.05, 6, 0.05]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>

        {/* Y-axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
          <group key={i} position={[0, tick * 5, 0]}>
            <mesh position={[-0.2, 0, 0]}>
              <boxGeometry args={[0.4, 0.02, 0.02]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <Text position={[-0.6, 0, 0]} fontSize={0.3} color="#64748b" anchorX="right" anchorY="middle">
              {formatNumber(Math.round(tick * Math.max(...data.map((d) => d.value))))}
            </Text>
          </group>
        ))}
      </group>

      {/* X-axis */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[totalWidth + 2, 0.05, 0.05]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      {/* Line */}
      <primitive
        object={
          new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: "#8b5cf6", linewidth: 5 }))
        }
        ref={lineRef}
      />

      {/* Data points */}
      {data.map((item, index) => {
        const x = startX + index * spacing
        const y = item.normalizedValue * 5

        return (
          <group key={index}>
            <mesh
              ref={(el) => (pointsRef.current[index] = el)}
              position={[x, y, 0]}
              onPointerOver={() => setHoveredIndex(index)}
              onPointerOut={() => setHoveredIndex(null)}
            >
              <sphereGeometry args={[0.2, 32, 32]} />
              <meshStandardMaterial
                color={item.color}
                metalness={0.8}
                roughness={0.2}
                emissive={hoveredIndex === index ? item.color : "#000000"}
                emissiveIntensity={hoveredIndex === index ? 0.5 : 0}
              />
            </mesh>

            {/* Value label */}
            {hoveredIndex === index && (
              <Text position={[x, y + 0.5, 0]} fontSize={0.4} color="#1e293b" anchorX="center" anchorY="middle">
                {formatNumber(item.value)}
              </Text>
            )}

            {/* X-axis label */}
            <Text
              position={[x, -0.5, 0.2]}
              fontSize={0.3}
              color="#64748b"
              maxWidth={1.5}
              anchorX="center"
              anchorY="top"
              rotation={[0, 0, Math.PI / 4]}
            >
              {item.label.length > 10 ? item.label.substring(0, 10) + "..." : item.label}
            </Text>
          </group>
        )
      })}

      {/* Area under the curve - removed as requested */}
      {/* <mesh position={[0, 0, -0.1]}>
        <shapeGeometry args={[createAreaShape(data, startX, spacing)]} />
        <meshStandardMaterial color="#8b5cf6" transparent={true} opacity={0.2} side={THREE.DoubleSide} />
      </mesh> */}
    </group>
  )
}

// Helper function to create area shape under the line
function createAreaShape(data: ChartDataItem[], startX: number, spacing: number) {
  const shape = new THREE.Shape()

  // Start at the first point at the bottom
  shape.moveTo(startX, 0)

  // Add all data points
  data.forEach((item, index) => {
    shape.lineTo(startX + index * spacing, item.normalizedValue * 5)
  })

  // Close the shape by going back to the bottom
  shape.lineTo(startX + (data.length - 1) * spacing, 0)
  shape.lineTo(startX, 0)

  return shape
}