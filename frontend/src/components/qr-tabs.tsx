import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageQRCodeCard } from '@/components/qr-card'

type QRTabsProps = {
  serverFiles: { name: string; blend: string, url: string }[]
  text: string
  loading: boolean
}

export function QRTabs({ serverFiles: _serverFiles, text, loading }: QRTabsProps) {
  const [selectedBlend, setSelectedBlend] = useState(_serverFiles[0]?.blend || '')
  const [serverFiles, setServerFiles] = useState(_serverFiles)

  useEffect(() => {
    setServerFiles(_serverFiles)
    // If the selected blend is no longer in the new serverFiles, select the first available blend
    if (!_serverFiles.some(file => file.blend === selectedBlend)) {
      setSelectedBlend(_serverFiles[0]?.blend || '')
    }
  }, [_serverFiles, selectedBlend])

  if (serverFiles.length === 0) {
    return null // or return a placeholder component
  }

  const selectedFile = serverFiles.find(f => f.blend === selectedBlend) || serverFiles[0]

  return (
    <Tabs
      value={selectedBlend}
      onValueChange={(value) => {
        setSelectedBlend(value)
      }}
      className="w-full"
    >
      <TabsList className="w-full flex-wrap justify-center h-auto min-h-[40px] mb-8">
        {serverFiles.map((file, index) => (
          <TabsTrigger key={index} value={file.blend} className="flex-grow-0">
            {file.blend}
          </TabsTrigger>
        ))}
      </TabsList>
      <ImageQRCodeCard title={text} image={`${selectedFile.url}`} loading={loading} />
    </Tabs>
  )
}