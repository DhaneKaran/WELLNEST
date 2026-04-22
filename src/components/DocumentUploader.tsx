"use client";
import { useState } from 'react';

interface DocumentUploaderProps {
  onUploadComplete: (url: string) => void;
}

export default function DocumentUploader({ onUploadComplete }: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setIsUploading(true);
    const file = e.target.files[0];
    
    // Simulate upload process
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          onUploadComplete(`https://storage.example.com/${file.name}`);
          setIsUploading(false);
          setProgress(0);
          return 0;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="mt-2">
      <input 
        type="file" 
        onChange={handleFileChange}
        disabled={isUploading}
        className="w-full p-2 border rounded"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      />
      
      {isUploading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Uploading: {progress}%
          </p>
        </div>
      )}
    </div>
  );
} 