'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react'

export default function QRCodeGenerator() {
  const [text, setText] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [qrCodes, setQrCodes] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    const reader = new FileReader()
    reader.onload = (event) => {
      setImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 1 })

  const generateQRCodes = async () => {
    if (!text && !image) return
    setIsGenerating(true)

    setIsGenerating(false)
  }

  return (

    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-8">Create QR Code</h1>
      <Card className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
        <div className="p-6 space-y-6">
          <div>
            <Label htmlFor="text-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">Enter your text</Label>
            <Input
              id="text-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text for QR code"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div
            {...getRootProps()}
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors duration-200 ease-in-out ${isDragActive ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900' : 'border-gray-300 dark:border-gray-600'
              }`}
          >
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600 dark:text-gray-400">
                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                  <span>Upload a file</span>
                  <input {...getInputProps()} />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
          {image && (
            <div className="mt-4 flex justify-center">
              <div className="relative w-40 h-40 rounded-lg overflow-hidden">
                <img src={image} alt="Uploaded" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          )}
          <Button
            onClick={generateQRCodes}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            disabled={isGenerating || (!text && !image)}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Generating...
              </>
            ) : (
              'Generate QR Codes'
            )}
          </Button>
        </div>
      </Card>
      {qrCodes.length > 0 && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-6">
          {qrCodes.map((qr, index) => (
            <Card key={index} className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow-lg transition-transform duration-300 ease-in-out hover:scale-105">
              <div className="p-4">
                <img src={qr} alt={`QR Code ${index + 1}`} className="w-full h-auto" />
                <p className="mt-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">QR Code {index + 1}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>

  )
}