import React, { useState } from 'react';
// import { Alert, AlertDescription } from '@/components/ui/alert';

interface OutputFile {
  name: string;
  blend: string;
}

const ImageUploader = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image")) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreview('');
      setError('Please select an image file');
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
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
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-2xl font-bold mb-4">Image Uploader</h1>
      <input
        type="file"
        onChange={handleFileChange}
        accept="image/*"
        className="mb-4"
      />
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        placeholder="Enter text to send"
        className="w-full px-3 py-2 mb-4 border rounded"
      />
      {preview && (
        <img src={preview} alt="Preview" className="mb-4 max-w-full h-auto" />
      )}
      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Upload Image and Text
      </button>
      {uploadStatus && <p className="mt-4 text-green-600">{uploadStatus}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {outputFiles.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Generated Images:</h2>
          <div className="grid grid-cols-2 gap-4">
            {outputFiles.map((file, index) => (
              <div key={index} className="text-center">
                <img
                    src={`/api/${file.name}`}
                    alt={`Generated img ${index + 1}`}
                  title={file.blend}
                  className="w-full h-auto rounded"
                />
                <p className="mt-2 text-sm font-medium">{file.blend}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;