import { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Upload, FileText, X, Plus } from 'lucide-react';

interface SimpleFileUploadProps {
  onFileSelect: (file: File) => void;
  onFileNameChange: (fileName: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  currentFileName?: string;
  files?: Array<{id: string, name: string, url: string, originalName: string}>;
  onRemoveFile?: (fileId: string) => void;
  onViewFile?: (fileUrl: string) => void;
  multiple?: boolean;
}

export function SimpleFileUpload({ 
  onFileSelect, 
  onFileNameChange, 
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
  maxSize = 10,
  currentFileName,
  files = [],
  onRemoveFile,
  onViewFile,
  multiple = false
}: SimpleFileUploadProps) {
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const fileArray = Array.from(selectedFiles);
    fileArray.forEach(file => {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`Файл "${file.name}" слишком большой. Максимальный размер: ${maxSize}MB`);
        return;
      }
      onFileSelect(file);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" asChild size="sm">
          <label className="cursor-pointer">
            <Upload className="h-4 w-4 mr-1" />
            {multiple ? 'Выберите файлы' : 'Выберите файл'}
            <input
              type="file"
              className="hidden"
              accept={acceptedTypes.join(',')}
              multiple={multiple}
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </label>
        </Button>
        <span className="text-xs text-muted-foreground">
          {acceptedTypes.join(', ')}, макс. {maxSize}MB
        </span>
      </div>

      {/* Display uploaded files - compact view */}
      {files && files.length > 0 && (
        <div className="space-y-1">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="h-3 w-3 text-blue-500 flex-shrink-0" />
                <span className="font-medium truncate">{file.name}</span>
                <span className="text-gray-500 flex-shrink-0">({file.originalName})</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {onViewFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => onViewFile(file.url)}
                  >
                    Просмотр
                  </Button>
                )}
                {onRemoveFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onRemoveFile(file.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
