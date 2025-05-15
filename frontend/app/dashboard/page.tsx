"use client"

import { useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, AlertCircle, CheckCircle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import Papa from "papaparse"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TypewriterEffect } from "@/components/ui/typewriter-effect"
import { ChartDisplay } from "@/components/chart-display"

interface ResultItem {
  [key: string]: string | number
}

export default function Dashboard() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [previewData, setPreviewData] = useState<any[] | null>(null)
  const [previewColumns, setPreviewColumns] = useState<string[] | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showPreview, setShowPreview] = useState(true)
  const [serverResponse, setServerResponse] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  const [resultData, setResultData] = useState<ResultItem[] | null>(null)
  const [resultHeaders, setResultHeaders] = useState<string[] | null>(null)
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(null)
  const [selectedLabelKey, setSelectedLabelKey] = useState<string | null>(null)
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm()

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        setUploadedFile(file)
        setError(null)
        parseCSVPreview(file)
        toast({
          title: "File selected",
          description: `${file.name} is ready for upload`,
          duration: 3000,
        })
      }
    },
    onDropRejected: (fileRejections) => {
      setError("Please upload a valid CSV file")
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload a valid CSV file",
        duration: 3000,
      })
    },
  })

  const parseCSVPreview = (file: File) => {
    Papa.parse(file, {
      preview: 5,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setPreviewData(results.data as ResultItem[])
          const columns = results.meta.fields || []
          setPreviewColumns(columns)
        }
      },
      error: (csvError) => {
        setError(`Error parsing CSV: ${csvError.message}`)
        toast({
          variant: "destructive",
          title: "Parsing error",
          description: `Error parsing CSV: ${csvError.message}`,
          duration: 3000,
        })
      },
    })
  }

  const onSubmitPrompt = async (formDataFromHook: any) => {
    if (!uploadedFile) {
      setError("Please upload a file first")
      return
    }
    setShowWarningDialog(true)
  }

  const handleConfirmSubmit = async () => {
    if (!uploadedFile) {
      setError("No file selected")
      return
    }

    try {
      setIsUploading(true)
      setError(null)
      setUploadProgress(0)

      toast({
        title: "Processing",
        description: "Uploading file and processing data...",
        duration: 5000,
      })

      const formData = new FormData()
      formData.append("file", uploadedFile)
      formData.append(
        "prompt",
        (document.querySelector('textarea[name="prompt"]') as HTMLTextAreaElement)?.value || "No prompt provided",
      )

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch("https://vizionarybackendserver.onrender.com/process", {
      // Parse the full CSV file
        method: "POST",
        body: formData,
      })
      clearInterval(progressInterval)
      setUploadProgress(100)
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `Server responded with status: ${response.status}` }))
        throw new Error(errorData.message || `Server responded with status: ${response.status}`)
      }
      const responseData = await response.json()
      toast({
        title: "Success!",
        description: responseData.message || "File processed successfully",
        duration: 5000,
      })
      setServerResponse(responseData.message || "File processed successfully")
      setResultData(responseData.result_data as ResultItem[])
      setResultHeaders(responseData.result_headers as string[])
      setIsSuccess(true)
    } catch (err: any) {
      console.error("Submission error:", err)
      setError(`Error: ${err.message}`)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
        duration: 5000,
      })
    } finally {
      setIsUploading(false)
      setShowWarningDialog(false)
    }
  }

  const handleReset = () => {
    // Reset to upload form
    setIsSuccess(false)
    setUploadedFile(null)
    setPreviewData(null)
    setPreviewColumns(null)
    setServerResponse(null)
    setResultData(null)
    setResultHeaders(null)
    setSelectedDataKey(null)
    setSelectedLabelKey(null)
    setError(null)
    reset()
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-gradient-to-b from-white to-gray-50">
      <motion.header
        className="w-full max-w-4xl mb-4 pt-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center">
          <TypewriterEffect
            words={[
              {
                text: "Vizionary",
                className:
                  "text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600",
              },
            ]}
          />
          <motion.div
            className="h-1 w-24 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mt-2 mb-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: "6rem" }}
            transition={{ delay: 1.5, duration: 0.8 }}
          />
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Transform Your Data into Insights</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Upload your CSV file to visualize and analyze your data in seconds.
            </p>
          </div>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="upload-form"
            className="w-full max-w-4xl space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
          >
            {/* Dropzone */}
            <motion.div
              whileHover={{ scale: 1.01, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.99 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md ${
                  isDragActive
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-gray-300 hover:border-purple-400 hover:bg-purple-50/30"
                }`}
              >
                <input {...getInputProps()} />
                <motion.div
                  className="flex flex-col items-center justify-center space-y-4"
                  animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 2,
                      ease: "easeInOut",
                    }}
                  >
                    <Upload className={`h-16 w-16 ${isDragActive ? "text-purple-500" : "text-gray-400"}`} />
                  </motion.div>
                  <div>
                    <p className="text-xl font-medium">
                      {isDragActive ? "Drop the CSV file here" : "Drag & drop a CSV file here"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">or click to select a file</p>
                  </div>
                </motion.div>
              </div>
              <motion.div
                className="mt-4 p-2 bg-gray-100 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <p className="text-sm text-gray-600">Supported file types: CSV</p>
              </motion.div>
            </motion.div>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert variant="destructive" className="border-red-300 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Preview */}
            <AnimatePresence>
              {uploadedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  <motion.div
                    className="p-5 border rounded-xl bg-white shadow-sm"
                    whileHover={{
                      y: -2,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <motion.div initial={{ rotate: -10 }} animate={{ rotate: 0 }} transition={{ duration: 0.3 }}>
                          <FileText className="h-6 w-6 text-purple-500" />
                        </motion.div>
                        <span className="font-medium">{uploadedFile.name}</span>
                        <span className="text-xs text-muted-foreground px-2 py-1 bg-gray-100 rounded-full">
                          {(uploadedFile.size / 1024).toFixed(2)} KB
                        </span>
                      </div>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPreview(!showPreview)}
                          className="text-gray-500 transition-all duration-200 hover:bg-gray-100"
                        >
                          {showPreview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {showPreview && previewData && previewColumns && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 overflow-hidden"
                        >
                          <div className="rounded-lg border overflow-hidden">
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    {previewColumns.map((column, index) => (
                                      <TableHead key={index} className="bg-gray-50 font-medium">
                                        {column}
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {previewData.map((row, rowIndex) => (
                                    <TableRow
                                      key={rowIndex}
                                      className="hover:bg-gray-50 transition-colors duration-150"
                                    >
                                      {previewColumns.map((column, colIndex) => (
                                        <TableCell key={colIndex} className="py-2">
                                          {row[column]}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            <div className="p-2 text-center text-xs text-gray-500 bg-gray-50 border-t">
                              Showing first {previewData.length} rows of data
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Warning Dialog */}
            <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>CSV Format Warning</AlertDialogTitle>
                  <div className="space-y-4">
                    <AlertDialogDescription>
                      Before proceeding, please ensure your CSV file is properly formatted for optimal LLM processing:
                    </AlertDialogDescription>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-sm text-left">
                      <li>All column headers should be unique and descriptive</li>
                      <li>Data should be consistent and properly formatted</li>
                      <li>No empty rows or columns</li>
                      <li>Special characters should be properly escaped</li>
                      <li>Dates should be in a consistent format</li>
                    </ul>
                    <AlertDialogDescription className="font-medium">
                      Would you like to proceed with the current file?
                    </AlertDialogDescription>
                  </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <AlertDialogCancel className="transition-all duration-200 hover:bg-gray-100 w-full md:w-auto">
                      Cancel
                    </AlertDialogCancel>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <AlertDialogAction
                      onClick={handleConfirmSubmit}
                      className="bg-purple-600 hover:bg-purple-700 transition-all duration-200 w-full md:w-auto"
                    >
                      Proceed
                    </AlertDialogAction>
                  </motion.div>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Prompt and Submit Button */}
            <AnimatePresence>
              {uploadedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="space-y-5"
                >
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="relative"
                  >
                    <Textarea
                      placeholder="Enter your prompt here... (e.g., 'Show me a bar chart of sales by region')"
                      className="min-h-[180px] p-4 text-base border-gray-200 focus-visible:ring-purple-400 shadow-sm transition-all duration-300 resize-none hover:border-purple-300"
                      {...register("prompt", {
                        required: "Prompt is required",
                      })}
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
                  </motion.div>

                  {isUploading && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Processing file...</span>
                        <span>{uploadProgress > 0 ? `${uploadProgress}%` : ""}</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </motion.div>
                  )}

                  <motion.div
                    whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Button
                      onClick={handleSubmit(onSubmitPrompt)}
                      className="w-full py-6 text-lg font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300"
                      disabled={isUploading || !uploadedFile}
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
                        {isUploading ? "Processing..." : "Submit"}
                      </motion.span>
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          // Success View with Chart
          <motion.div
            key="success-message"
            className="w-full max-w-6xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Success Info Section */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full md:w-1/2"
              >
                <Card className="p-6 h-full shadow-lg border-0 bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all duration-300">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"
                  >
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-xl font-bold text-center mb-4 text-gray-800"
                  >
                    Data Visualization
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-center text-gray-600 mb-6"
                  >
                    {serverResponse || "Your data is ready to be visualized"}
                  </motion.p>

                  {resultHeaders && resultHeaders.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="mb-6"
                    >
                      <h3 className="text-lg font-medium mb-3">Select Chart Data</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Label Column</label>
                          <select
                            className="w-full p-2 border rounded-md hover:border-purple-300 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all duration-200"
                            value={selectedLabelKey || ""}
                            onChange={(e) => setSelectedLabelKey(e.target.value)}
                          >
                            <option value="">Select a column for labels</option>
                            {resultHeaders.map((header) => (
                              <option key={`label-${header}`} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Data Column</label>
                          <select
                            className="w-full p-2 border rounded-md hover:border-purple-300 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all duration-200"
                            value={selectedDataKey || ""}
                            onChange={(e) => setSelectedDataKey(e.target.value)}
                          >
                            <option value="">Select a column for data values</option>
                            {resultHeaders.map((header) => (
                              <option key={`data-${header}`} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="flex justify-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleReset}
                        className="bg-purple-600 hover:bg-purple-700 transition-all duration-200"
                      >
                        Upload Another File
                      </Button>
                    </motion.div>
                  </motion.div>
                </Card>
              </motion.div>

              {/* Chart Display */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full md:w-1/2"
              >
                <ChartDisplay resultData={resultData} labelKey={selectedLabelKey} dataKey={selectedDataKey} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
