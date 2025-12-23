
import React, { useRef } from 'react';
import { ImageData } from '../types';

interface ImageUploaderProps {
  onImageSelected: (image: ImageData) => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      onImageSelected({
        base64: base64String,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
      });
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div 
        onClick={!isLoading ? triggerUpload : undefined}
        className={`border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer
          ${isLoading ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200 hover:border-blue-400 hover:bg-blue-50'}`}
      >
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">Upload an image to index</p>
          <p className="text-sm text-gray-500 mt-1">Drag and drop or click to browse</p>
        </div>
        {isLoading && (
          <div className="mt-4 flex items-center gap-2 text-blue-600 font-medium">
            <i className="fa-solid fa-spinner animate-spin"></i>
            <span>Processing Image...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
