'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  File,
  X,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { formatFileSize, cn } from '@/lib/utils';
import type { UploadStatus } from '@/types';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  status: UploadStatus;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'text/csv': ['.csv'],
  'text/plain': ['.csv'],
};

export function FileUpload({ onFilesSelected, status, error }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Limita quantidade de arquivos
      const newFiles = [...files, ...acceptedFiles].slice(0, MAX_FILES);
      setFiles(newFiles);
    },
    [files]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_TYPES,
      maxSize: MAX_FILE_SIZE,
      maxFiles: MAX_FILES,
      disabled: status === 'uploading' || status === 'processing',
    });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const isProcessing = status === 'uploading' || status === 'processing';

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 sm:p-12 transition-all duration-200 cursor-pointer',
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50',
          isProcessing && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center text-center">
          {isProcessing ? (
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
          ) : (
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary-600" />
            </div>
          )}

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isDragActive
              ? 'Solte os arquivos aqui'
              : isProcessing
              ? status === 'uploading'
                ? 'Enviando...'
                : 'Analisando...'
              : 'Arraste seus extratos aqui'}
          </h3>

          <p className="text-gray-500 mb-4">
            {isProcessing
              ? 'Aguarde enquanto processamos seus extratos'
              : 'ou clique para selecionar arquivos'}
          </p>

          <div className="flex flex-wrap gap-2 justify-center text-xs text-gray-400">
            <span className="px-2 py-1 bg-gray-100 rounded">PDF</span>
            <span className="px-2 py-1 bg-gray-100 rounded">CSV</span>
            <span className="px-2 py-1 bg-gray-100 rounded">Até 10MB</span>
            <span className="px-2 py-1 bg-gray-100 rounded">Máx. 5 arquivos</span>
          </div>
        </div>
      </div>

      {/* Erros de rejeição */}
      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Arquivos rejeitados</span>
          </div>
          <ul className="text-sm text-red-600 space-y-1">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name}>
                {file.name}: {errors.map((e) => e.message).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Erro da API */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Lista de arquivos selecionados */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Arquivos selecionados ({files.length})
          </h4>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <File className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px] sm:max-w-none">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                {!isProcessing && (
                  <button
                    onClick={() => removeFile(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label={`Remover ${file.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Botão de análise */}
          <button
            onClick={handleAnalyze}
            disabled={files.length === 0 || isProcessing}
            className={cn(
              'w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200',
              'bg-gradient-to-r from-primary-600 to-primary-500',
              'hover:from-primary-700 hover:to-primary-600',
              'focus:ring-4 focus:ring-primary-500/25',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'shadow-lg shadow-primary-500/25'
            )}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {status === 'uploading' ? 'Enviando...' : 'Analisando extratos...'}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Analisar {files.length} {files.length === 1 ? 'extrato' : 'extratos'}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Mensagem de privacidade */}
      <p className="mt-6 text-center text-xs text-gray-400">
        <span className="inline-flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-primary-500" />
          Seus arquivos são analisados e descartados imediatamente.
          Não armazenamos nenhum dado.
        </span>
      </p>
    </div>
  );
}
