import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageQRCodeCard } from '@/components/qr-card'
import { blends, type Blend } from '@server/shared-types'

type QRTabsProps = {
  serverFiles: { name: string; blend: string, url: string }[]
  text: string
  loading: boolean
  getFileForBlend: (blend: Blend) => void
  onBlendChange?: (blend: Blend) => void
}

export function QRTabs({ serverFiles: _serverFiles, text, loading: _loading, getFileForBlend, onBlendChange }: QRTabsProps) {
  const [selectedBlend, setSelectedBlend] = useState<Blend>(_serverFiles[0]?.blend as Blend || blends[0])
  const [serverFiles, setServerFiles] = useState(_serverFiles)
  const [loading, setLoading] = useState(_loading)
  const [selectedFile, setSelectedFile] = useState(_serverFiles[0])

  useEffect(() => {
    setLoading(_loading)
  }, [_loading])

  useEffect(() => {
    setServerFiles(_serverFiles)
    const file = _serverFiles.find(f => f.blend === selectedBlend)
    setSelectedFile(file || _serverFiles[0])
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_serverFiles])

  if (serverFiles.length === 0) {
    return null // or return a placeholder component
  }

  const handleSelectedBlendChange = async (value: string) => {
    setSelectedBlend(value as Blend)
    onBlendChange?.(value as Blend)
    console.log('handleSelectedBlendChange', value)
    const file = _serverFiles.find(f => f.blend === value)
    if (!file) {
      console.log('getFileForBlend', value)
      setLoading(true)
      getFileForBlend(value as Blend)
      return
    }
    setSelectedFile(file)
  }


  return (
    <Tabs
      value={selectedBlend}
      onValueChange={handleSelectedBlendChange}
      className="w-full"
    >
      <TabsList className="w-full flex-wrap justify-center h-auto min-h-[40px] mb-8">
        {blends.map((blend, index) => (
          <TabsTrigger key={index} value={blend} className="flex-grow-0">
            {blend}
          </TabsTrigger>
        ))}
      </TabsList>
      <ImageQRCodeCard title={text} image={`${selectedFile.url}`} loading={loading} />
    </Tabs>
  )
}