import React, { useState, useCallback, useRef } from 'react';

interface OutputFile {
  name: string;
  blend: string;
}

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button
    {...props}
    className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${props.className || ''}`}
  >
    {children}
  </button>
);

const ImageUploader: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith("image")) {
      setSelectedFile(file);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreview(null);
      setError('Please select an image file');
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDeleteFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('text', text);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus(`Upload successful! Filename: ${result.filename}`);
        setOutputFiles(result.outputFileNames);
        setError('');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(`Upload failed: ${error.message}`);
        console.log(error);
      } else {
        setError('Upload failed: An unknown error occurred');
        console.log('Unknown error:', error);
      }
      setUploadStatus('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-3xl w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="flex flex-col items-center space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Generate QR Codes</h1>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full">
              <div className="flex-1">
                <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                  Upload Image
                </label>
                <div
                  className={`mt-1 border-2 border-dashed rounded-md px-6 pt-5 pb-6 flex justify-center ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {preview ? (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-w-full h-auto max-h-40 rounded"
                      />
                      <button
                        onClick={handleDeleteFile}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="image"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            type="file"
                            id="image"
                            name="image"
                            className="sr-only"
                            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                            accept="image/*"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                  URL
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="url"
                    name="url"
                    value={text}
                    onChange={handleTextChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter a URL"
                  />
                </div>
              </div>
            </div>
            <Button onClick={handleUpload}>Generate QR Codes</Button>
          </div>
        </div>
      </div>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {uploadStatus && <p className="mt-4 text-green-600">{uploadStatus}</p>}
      {outputFiles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8 max-w-6xl w-full px-4 sm:px-6 lg:px-8">
          {outputFiles.map((file, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
              <img
                src={`/api/${file.name}`}
                alt={`Generated QR Code ${index + 1}`}
                width={200}
                height={200}
                className="w-full max-w-[200px] h-auto"
                style={{ aspectRatio: "200/200", objectFit: "cover" }}
              />
              <div className="mt-4 flex items-center gap-2">
                <a href={`/api/${file.name}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  View QR Code
                </a>
                <Button
                  onClick={() => {
                    // Implement download functionality here
                    console.log(`Downloading ${file.name}`);
                  }}
                >
                  Download
                </Button>
              </div>
              <p className="mt-2 text-sm font-medium">{file.blend}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;