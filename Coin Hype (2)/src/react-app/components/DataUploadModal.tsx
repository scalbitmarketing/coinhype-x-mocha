import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, AlertCircle, CheckCircle, Database, Download } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';

interface DataUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadResult {
  success: boolean;
  message: string;
  recordsProcessed?: number;
  errors?: string[];
}

const DataUploadModal: React.FC<DataUploadModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState<string>('users');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dataTypes = [
    { value: 'users', label: 'Users', description: 'Upload user account data' },
    { value: 'transactions', label: 'Transactions', description: 'Upload transaction history' },
    { value: 'game_sessions', label: 'Game Sessions', description: 'Upload game session data' },
    { value: 'balances', label: 'User Balances', description: 'Upload user balance data' },
    { value: 'referrals', label: 'Referrals', description: 'Upload referral data' },
    { value: 'custom', label: 'Custom', description: 'Upload custom structured data' }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['text/csv', 'application/json', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      alert('Please upload a CSV or JSON file');
      return false;
    }

    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataType', dataType);

      const response = await fetch('/api/admin/upload-data', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          recordsProcessed: data.recordsProcessed
        });
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setResult({
          success: false,
          message: data.error || 'Upload failed',
          errors: data.errors
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error occurred during upload'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/download-template?type=${type}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_template.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download template:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Data Upload</h2>
                <p className="text-gray-400 text-sm">Upload CSV or JSON files to populate database</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Data Type Selection */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-3">
              Select Data Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {dataTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setDataType(type.value)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    dataType === type.value
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                      : 'border-white/20 hover:border-white/40 text-gray-300 hover:text-white'
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs opacity-70">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Template Download */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium">Download Template</span>
              <button
                onClick={() => downloadTemplate(dataType)}
                className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Get CSV Template</span>
              </button>
            </div>
            <p className="text-gray-400 text-xs">
              Download a template file with the correct column structure for {dataTypes.find(t => t.value === dataType)?.label.toLowerCase()}
            </p>
          </div>

          {/* File Upload Area */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-3">
              Upload File
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-400/5'
                  : file
                  ? 'border-green-400 bg-green-400/5'
                  : 'border-white/30 hover:border-white/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center justify-center space-x-3">
                  <FileText className="w-8 h-8 text-green-400" />
                  <div>
                    <div className="text-white font-medium">{file.name}</div>
                    <div className="text-gray-400 text-sm">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-white mb-2">Drop your file here or click to browse</div>
                  <div className="text-gray-400 text-sm">Supports CSV and JSON files (max 10MB)</div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Result */}
          {result && (
            <div className={`mb-6 p-4 rounded-lg ${
              result.success ? 'bg-green-500/10 border border-green-400/20' : 'bg-red-500/10 border border-red-400/20'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                  {result.success ? 'Upload Successful' : 'Upload Failed'}
                </span>
              </div>
              <p className="text-gray-300 text-sm mb-2">{result.message}</p>
              {result.recordsProcessed && (
                <p className="text-green-400 text-sm">
                  Successfully processed {result.recordsProcessed} records
                </p>
              )}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-red-400 text-sm font-medium mb-1">Errors:</p>
                  <ul className="text-red-300 text-sm space-y-1">
                    {result.errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="truncate">• {error}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-gray-400">... and {result.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload Data'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DataUploadModal;
