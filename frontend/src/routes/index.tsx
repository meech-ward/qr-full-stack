import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { TextQRCodeCard } from '@/components/qr-card'
import { Upload, Loader2 } from 'lucide-react'
import { type Options } from 'qr-code-styling'
import { toast } from "sonner"
import { QROptions } from '@/components/card-options'
import { ColorPicker } from '@/components/color-picker'
import { useMutation } from '@tanstack/react-query'
import { QRTabs } from '@/components/qr-tabs'
import { useDebounce } from '@/lib/useDebounce'
import { createQrCode as createQrCodeServer, type CreateQrCodeResponse, createQrID } from '@/lib/api'
import { getQrImageBufferBlackAndWhite } from '@/lib/getQrImageBuffer'
import { useLocalStorage } from '@/lib/useLocalStorage'


// Route component
export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const [text, setText] = useState('example.com')
  const debouncedText = useDebounce(text, 500);
  const [file, setFile] = useState<File | undefined>(undefined)
  const [serverFiles, setServerFiles] = useState<CreateQrCodeResponse["files"]>([])

  const [codes, setCodes] = useLocalStorage<{ id: string, text: string }[]>('codes', [])

  const [qrOptions, setQrOptions] = useState<Options>({
    width: 1000,
    height: 1000,
    type: "svg",
    data: text,
    qrOptions: {
      errorCorrectionLevel: "H",
    },
    dotsOptions: {
      color: "#000000",
      type: "square",
    },
    backgroundOptions: {
      color: "#FFFFFF",
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const qrImageBuffer = await getQrImageBufferBlackAndWhite(text, qrOptions)
      const qrImageFile = new File([qrImageBuffer], "qr.png", { type: "image/png" })
      return createQrCodeServer(
        {
          qrImage: qrImageFile,
          save: "false",
          bgImage: file,
        }
      )
    },
    onSuccess: (data) => {
      console.log(data)
      setServerFiles(data.files)
    },
    onError: (error) => {
      toast.error("Error uploading image. Please try again.", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { id, type } = await createQrID({ text: text })
      const url = `${window.location.origin}/s/${id}`
      const qrImageBuffer = await getQrImageBufferBlackAndWhite(url, qrOptions)
      const qrImageFile = new File([qrImageBuffer], "qr.png", { type: "image/png" })
      return createQrCodeServer(
        {
          id: id,
          qrImage: qrImageFile,
          save: "true",
          bgImage: file,
        }
      )
    },
    onSuccess: (data) => {
      if (data.id) {
        setCodes([{ id: data.id, text: text }, ...codes])
      }
      isFirstLoad.current = 0
      setText("")
      setServerFiles([])
      setFile(undefined)
      setQrOptions((options) => ({
        ...options,
        data: "",
      }))
    },
    onError: (error) => {
      toast.error("Error saving QR code. Please try again.", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    },
  })
  // Update qrOptions.data when debouncedText changes
  useEffect(() => {
    setQrOptions((options) => ({
      ...options,
      data: debouncedText,
    }))
  }, [debouncedText])

  // Trigger mutation when file, qrOptions, or debouncedText change
  const isFirstLoad = useRef(0);

  useEffect(() => {
    if (!debouncedText || !qrOptions.data || !file) {
      return;
    }

    uploadMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, qrOptions, debouncedText])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  })

  const saveQRCode = () => {
    console.log('saveQRCode')
    saveMutation.mutate()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-foreground">Create QR Code</h1>
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>QR Code Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="text-input">Enter your text</Label>
            <Input
              id="text-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text for QR code"
            />
          </div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-6 text-center transition-colors duration-200 ease-in-out ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'
              } h-[180px] flex items-center justify-center`}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="space-y-1 text-center">
                {uploadMutation.isPending || saveMutation.isPending ? (
                  <>
                    <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="flex text-sm text-muted-foreground justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer font-medium text-primary hover:text-primary/80">
                        <span>Upload a file</span>
                        <input {...getInputProps()} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button onClick={saveQRCode} className="w-full" disabled={!text}>
            {uploadMutation.isPending || saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Save QR Code'
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center w-full mt-8">
        <QRTabs serverFiles={serverFiles} text={text} loading={uploadMutation.isPending || saveMutation.isPending} />
        <div className="flex flex-col md:flex-row items-center justify-center w-full gap-8 mt-8">
          <ColorPicker
            defaultValue="#000000"
            onChange={(color) =>
              setQrOptions((options) => ({
                ...options,
                dotsOptions: { ...options.dotsOptions, color },
              }))
            }
          />
          <div className="flex flex-col items-center gap-y-8">
            <QROptions
              onValueChange={(value) => {
                setQrOptions((options) => ({
                  ...options,
                  dotsOptions: { ...options.dotsOptions, type: value },
                }))
              }}
            />
            <TextQRCodeCard title={text} text={text} qrOptions={qrOptions} />
          </div>
          <ColorPicker
            defaultValue="#FFFFFF"
            onChange={(color) =>
              setQrOptions((options) => ({
                ...options,
                backgroundOptions: { ...options.backgroundOptions, color },
              }))
            }
          />
        </div>
      </div>
    </div>
  )
}
