import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Download, Search, AlertCircle } from 'lucide-react';
import KyberLike from './KyberLike';

const Alert = ({ children, show, onClose, type = 'error' }) => (
  show ? (
    <div className={`rounded-md ${type === 'success' ? 'bg-green-50' : 'bg-red-50'} p-4 mt-4`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <AlertCircle className="h-5 w-5 text-red-400" />
          )}
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{children}</p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md ${type === 'success' ? 'bg-green-50 text-green-500 hover:bg-green-100' : 'bg-red-50 text-red-500 hover:bg-red-100'} p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${type === 'success' ? 'focus:ring-green-600 focus:ring-offset-green-50' : 'focus:ring-red-600 focus:ring-offset-red-50'}`}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null
);

const ProgressBar = ({ progress }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
    <div 
      className="bg-purple-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

const FileViewer = () => {
  const { fileId: urlFileId } = useParams();
  const navigate = useNavigate();
  const [fileId, setFileId] = useState(urlFileId || '');
  const [password, setPassword] = useState('');
  const [decryptedContent, setDecryptedContent] = useState(null);
  const [decodedContent, setDecodedContent] = useState(null);
  const [error, setError] = useState(null);
  const [showContent, setShowContent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState(null);
  const [progress, setProgress] = useState(0);
  const kyberLike = KyberLike();

  useEffect(() => {
    if (urlFileId) {
      setFileId(urlFileId);
      console.log('URL File ID:', urlFileId);
    }
  }, [urlFileId]);

  const base64ToArrayBuffer = (base64) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const determineFileType = (arrayBuffer) => {
    const arr = new Uint8Array(arrayBuffer).subarray(0, 4);
    let header = '';
    for (let i = 0; i < arr.length; i++) {
      header += arr[i].toString(16);
    }
    console.log('File header:', header);

    // Check the first few bytes of the file to determine its type
    switch (header) {
      case "89504e47":
        return "image/png";
      case "47494638":
        return "image/gif";
      case "ffd8ffe0":
      case "ffd8ffe1":
      case "ffd8ffe2":
        return "image/jpeg";
      case "25504446":
        return "application/pdf";
      default:
        const textDecoder = new TextDecoder('utf-8');
        const text = textDecoder.decode(new Uint8Array(arrayBuffer.slice(0, 5)));
        if (text === "<?xml" || text.startsWith("<svg")) {
          return "image/svg+xml";
        }
        // If it's not a known binary format, assume it's text
        return "text/plain";
    }
  };

  const handleDecrypt = async () => {
    console.log('Decryption started');
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      console.log('Fetching file data for ID:', fileId);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/get_file.php?fileId=${fileId}`);
      const data = await response.json();
      console.log('Fetched data:', data);

      if (!response.ok || !data.encryptedData) {
        throw new Error(data.error || 'Failed to fetch file');
      }

      setProgress(25); // File fetched

      console.log('Decrypting data...');
      const decrypted = kyberLike.decrypt(data.encryptedData, password);
      console.log('Decryption successful, content length:', decrypted.length);
      setDecryptedContent(decrypted);

      setProgress(75); // Decryption complete

      // Decode the base64 content
      const arrayBuffer = base64ToArrayBuffer(decrypted);
      setDecodedContent(arrayBuffer);

      // Use the filename from the metadata
      setFileName(data.fileName || `decrypted_file_${fileId}`);
      console.log('File name set:', data.fileName || `decrypted_file_${fileId}`);

      // Determine file type based on decoded content
      const contentType = determineFileType(arrayBuffer);
      console.log('Detected content type:', contentType);
      setFileType(contentType);

      setShowContent(true);
      setProgress(100); // Process complete
    } catch (error) {
      console.error('Decryption error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
      console.log('Decryption process completed');
    }
  };

  const handleDownload = () => {
    console.log('Download initiated');
    const blob = new Blob([decodedContent], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('Download completed');
  };

  const handleFileIdSubmit = (e) => {
    e.preventDefault();
    console.log('Navigating to file view with ID:', fileId);
    navigate(`/view/${fileId}`);
  };

  const renderFileContent = () => {
    console.log('Rendering file content, type:', fileType);
    if (!showContent) {
      return (
        <div className="bg-white p-4 rounded-md text-center text-gray-500">
          Content hidden
        </div>
      );
    }

    const blob = new Blob([decodedContent], { type: fileType });
    const url = URL.createObjectURL(blob);

    switch (fileType) {
      case "text/plain":
        return (
          <pre className="bg-white p-4 rounded-md overflow-x-auto max-h-60 text-sm">
            {new TextDecoder().decode(decodedContent)}
          </pre>
        );
      case "application/pdf":
        return (
          <iframe
            src={url}
            className="w-full h-96 rounded-md"
            title="PDF Viewer"
          />
        );
      case "image/jpeg":
      case "image/png":
      case "image/gif":
      case "image/svg+xml":
        return (
          <img
            src={url}
            alt="Decrypted Image"
            className="max-w-full h-auto rounded-md"
          />
        );
      default:
        return (
          <div className="bg-white p-4 rounded-md text-center text-gray-500">
            This file type is not supported for viewing. Please use the download button to access the file.
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">View Encrypted File</h1>
      
      <form onSubmit={handleFileIdSubmit} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <input
          type="text"
          placeholder="Enter File ID"
          value={fileId}
          onChange={(e) => setFileId(e.target.value)}
          className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
        >
          <Search className="w-4 h-4 mr-2" />
          Find File
        </button>
      </form>

      <input
        type="password"
        placeholder="Enter decryption password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      
      {isLoading && <ProgressBar progress={progress} />}

      <button
        onClick={handleDecrypt}
        disabled={isLoading}
        className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center disabled:bg-purple-300"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {progress < 25 ? 'Fetching...' : progress < 75 ? 'Decrypting...' : 'Processing...'}
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Decrypt File
          </>
        )}
      </button>
      
      <Alert show={error !== null} onClose={() => setError(null)}>
        {error}
      </Alert>
      
      {decodedContent && (
        <div className="mt-4 bg-gray-100 rounded-md p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Decrypted Content</h2>
            <div className="space-x-2">
              <button
                onClick={() => setShowContent(!showContent)}
                className="text-purple-600 hover:text-purple-800 transition-colors p-1 rounded-full hover:bg-purple-100"
                title={showContent ? "Hide content" : "Show content"}
              >
                {showContent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <button
                onClick={handleDownload}
                className="text-purple-600 hover:text-purple-800 transition-colors p-1 rounded-full hover:bg-purple-100"
                title="Download file"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
          {renderFileContent()}
        </div>
      )}
      
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">
        <div className="flex">
          <div className="flex-shrink-0">
            <Lock className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm">Your file is decrypted securely in your browser using AES-256 with a 512-bit derived key and a post-quantum inspired method for enhanced protection.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;