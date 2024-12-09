import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { TextQRCodeCard } from '@/components/qr-card'
import { type Options } from 'qr-code-styling'
import { toast } from "sonner"
import { QROptions } from '@/components/card-options'
import { ColorPicker } from '@/components/color-picker'
import { useMutation } from '@tanstack/react-query'
import { QRTabs } from '@/components/qr-tabs'
import { useDebounce } from '@/lib/useDebounce'
import { createQrCode as createQrCodeServer, previewQrCode as previewQrCodeServer, type CreateQrCodeResponse, createQrID } from '@/lib/api'
import { getQrImageBufferBlackAndWhite } from '@/lib/getQrImageBuffer'
import { useLocalStorage } from '@/lib/useLocalStorage'
import { blends, type Blend } from '@server/shared-types'
import { ImageDrop } from '@/components/image-drop'
import { useNavigate } from '@tanstack/react-router'

// Route component
export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const navigate = useNavigate({ from: '/' })


  const [text, setText] = useState('example.com')
  const debouncedText = useDebounce(text, 500);
  const [file, setFile] = useState<File | undefined>(undefined)
  const [serverFiles, setServerFiles] = useState<CreateQrCodeResponse["files"]>([])
  const [clearFiles, setClearFiles] = useState(false)
  const [codes, setCodes] = useLocalStorage<{ id: string, text: string }[]>('codes', [])
  const [selectedBlend, setSelectedBlend] = useState<Blend>(blends[0])

  const [qrOptions, setQrOptions] = useState<Options>({
    width: import.meta.env.VITE_QR_WIDTH ? parseInt(import.meta.env.VITE_QR_WIDTH) : 500,
    height: import.meta.env.VITE_QR_HEIGHT ? parseInt(import.meta.env.VITE_QR_HEIGHT) : 500,
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
    mutationFn: async (blend: Blend) => {
      if (!file) {
        throw new Error("No file selected");
      }
      const qrImageBuffer = await getQrImageBufferBlackAndWhite({ ...qrOptions })
      const qrImageFile = new File([qrImageBuffer], "qr.webp", { type: "image/webp" })
      return previewQrCodeServer(
        {
          qrImage: qrImageFile,
          blend: blend,
          bgImage: file,
        }
      )
    },
    onSuccess: (data) => {
      console.log(data)
      if (clearFiles) {
        setServerFiles(data.files)
        setClearFiles(false)
      } else {
        setServerFiles(files => [...files, ...data.files])
      }
    },
    onError: (error) => {
      toast.error("Error uploading image. Please try again.", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error("No file selected");
      }
      const { id } = await createQrID({ text: text })
      const url = `${window.location.origin}/s/${id}`
      const qrImageBuffer = await getQrImageBufferBlackAndWhite({ ...qrOptions, data: url })
      const qrImageFile = new File([qrImageBuffer], "qr.webp", { type: "image/webp" })
      return createQrCodeServer(
        {
          id: id,
          qrImage: qrImageFile,
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
      setSelectedBlend(blends[0])
      navigate({ to: '/my-codes' })
    },
    onError: (error) => {
      toast.error("Error saving QR code. Please try again.", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    },
  })
  // Update qrOptions.data when debouncedText changes
  useEffect(() => {
    setClearFiles(true)
    setQrOptions((options) => ({
      ...options,
      data: debouncedText,
    }))
  }, [debouncedText])

  // Trigger mutation when file, qrOptions, or debouncedText change
  const isFirstLoad = useRef(0);

  useEffect(() => {
    if (!qrOptions.data || !file || uploadMutation.isPending || saveMutation.isPending) {
      return;
    }
    console.log('useEffect', debouncedText, qrOptions.data, file)

    uploadMutation.mutate(selectedBlend);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, qrOptions.dotsOptions, qrOptions.data])


  const getFileForBlend = useCallback((blend: Blend) => {
    uploadMutation.mutate(blend);
  }, [uploadMutation])

  const saveQRCode = () => {
    console.log('saveQRCode')
    saveMutation.mutate()
  }

  const loading = uploadMutation.isPending || saveMutation.isPending

  return (
    <div className="container mx-auto px-4 py-8">
      {/* <h1 className="text-4xl font-extrabold text-center mb-8 text-foreground">Create QR Code</h1> */}
      {/* <div className="gap-6"> */}
      <Card className="bg-card">
        {/* <CardHeader>
          <CardTitle>QR Code Text</CardTitle>
        </CardHeader> */}
        <CardContent className="space-y-4">
          <div className="flex gap-x-8 mt-6">
            <div className="flex flex-col gap-y-2 flex-1">
              <Label htmlFor="text-input" className='text-xl'>QR Code Text</Label>
              <Input
                id="text-input"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text for QR code"
                disabled={loading}
              />
            </div>

            <ImageDrop
              onFileSelect={(file) => {
                setFile(file)
                setClearFiles(true)
              }}
              onFileDelete={() => {
                setFile(undefined)
                setClearFiles(true)
              }}
              hasFile={!!file}
              isLoading={uploadMutation.isPending || saveMutation.isPending}
            />
          </div>

        </CardContent>
      </Card>

      {/* <Card className="bg-card col-span-1">
          <CardHeader>
            <CardTitle>Background Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageDrop 
              onFileSelect={setFile}
              isLoading={uploadMutation.isPending || saveMutation.isPending}
            />
            
          </CardContent>
        </Card> */}
      {/* </div> */}

      <div className="flex flex-col items-center w-full mt-6">
        <QROptions
          disabled={uploadMutation.isPending || saveMutation.isPending}
          onValueChange={(value) => {
            setClearFiles(true)
            setQrOptions((options) => ({
              ...options,
              dotsOptions: { ...options.dotsOptions, type: value },
            }))
          }}
        />
      </div>

      {file && (
        <div className="flex flex-col items-center w-full mt-6">
          <QRTabs serverFiles={serverFiles} text={text} loading={loading} getFileForBlend={getFileForBlend} onBlendChange={setSelectedBlend} onSave={saveQRCode} />
        </div>
      )}

      {!file && (
        <div className="flex flex-col items-center w-full mt-6">

          <div className="flex flex-col md:flex-row items-center justify-center w-full gap-8">
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

              <TextQRCodeCard title={text} text={text} qrOptions={qrOptions} onSave={saveQRCode} />
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
      )}
    </div>
  )
}
