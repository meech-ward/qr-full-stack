import { useDropzone } from 'react-dropzone'
import { Upload, Loader2, X } from 'lucide-react'

interface ImageDropProps {
  onFileSelect: (file: File) => void
  onFileDelete?: () => void
  hasFile?: boolean
  isLoading?: boolean
}

export function ImageDrop({ onFileSelect, onFileDelete, hasFile, isLoading }: ImageDropProps) {
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && !isLoading) {
      onFileSelect(acceptedFiles[0])
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-md p-4 text-center transition-colors duration-200 ease-in-out ${
        isDragActive ? 'border-primary bg-primary/10' : 'border-border'
      } flex items-center justify-center`}
    >
      <div className="flex items-center justify-center">
        <div className="space-y-1 text-center">
          <div className="flex flex-col">
            {isLoading ? (
              <Loader2 className="mx-auto h-8 w-8 text-primary animate-spin" />
            ) : hasFile ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onFileDelete?.()
                }}
              >
                <X className="mx-auto h-8 w-8 text-muted-foreground" />
              </button>
            ) : (
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            )}
            <div className="flex text-sm text-muted-foreground justify-center">
              <label htmlFor="file-upload" className="relative cursor-pointer font-medium text-primary hover:text-primary/80">
                <span className='hidden md:block'>{(hasFile && !isLoading) ? 'Replace image' : 'Upload image'}</span>
                <input disabled={isLoading} {...getInputProps()} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 