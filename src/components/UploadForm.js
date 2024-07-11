import React, { useState, useCallback } from 'react';
import { Upload, Lock, FileText, Clock, Copy } from 'lucide-react';
import KyberLike from './KyberLike';

const Alert = ({ children, show, onClose, type = 'success' }) => (
    show ? (
        <div className={`rounded-md ${type === 'success' ? 'bg-green-50' : 'bg-red-50'} p-4`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    {type === 'success' ? (
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
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

const Toast = ({ message, show, onClose }) => (
    show ? (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg z-50">
            {message}
            <button onClick={onClose} className="ml-2 text-gray-300 hover:text-white">&times;</button>
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

const UploadForm = () => {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [progress, setProgress] = useState(0);
    const kyberLike = KyberLike();

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile && selectedFile.size <= 25 * 1024 * 1024) {
            setFile(selectedFile);
        } else {
            setUploadResult({ error: 'Please select a file smaller than 25MB' });
        }
    };

    const updateProgress = useCallback((currentStep, totalSteps) => {
        const newProgress = Math.round((currentStep / totalSteps) * 100);
        setProgress(newProgress);
    }, []);

    const handleUpload = async () => {
        if (!file || !password) {
            setUploadResult({ error: 'Please select a file and enter a password' });
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            const fileContent = await file.arrayBuffer();
            const fileContentBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    if (reader.result && typeof reader.result === 'string') {
                        resolve(reader.result.split(',')[1]);
                    } else {
                        reject(new Error('Failed to read file content'));
                    }
                };
                reader.onerror = () => reject(new Error('FileReader error'));
                reader.readAsDataURL(new Blob([fileContent]));
            });

            const encryptedData = await kyberLike.encrypt(fileContentBase64, password, updateProgress);

            setProgress(75); // Encryption complete, starting upload

            const response = await fetch(`${process.env.REACT_APP_API_URL}/upload.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    encryptedData: encryptedData,
                    filename: file.name
                }),
            });

            setProgress(100); // Upload complete

            const result = await response.json();
            if (result.success) {
                const shareableLink = `${process.env.REACT_APP_API_URL}/view/${result.fileId}`;
                setUploadResult({ success: `File uploaded successfully. Share link:`, link: shareableLink });
            } else {
                setUploadResult({ error: result.error });
            }
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadResult({ error: 'Upload failed. Please try again.' });
        }

        setUploading(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        });
    };

    return (
        <div className="space-y-6">
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-500 transition-colors">
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="file-upload"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    capture="environment"
                />
                <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-1 text-sm text-gray-600">
                        {file ? file.name : 'Tap to select a file or take a photo'}
                    </p>
                </div>
            </div>

            <input
                type="password"
                placeholder="Enter encryption password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {uploading && <ProgressBar progress={progress} />}

            <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-300 flex items-center justify-center"
            >
                {uploading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {progress < 75 ? `Encrypting... ${progress}%` : progress < 100 ? 'Uploading...' : 'Processing...'}
                    </>
                ) : (
                    <>
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Securely
                    </>
                )}
            </button>

            <Alert
                show={uploadResult !== null}
                onClose={() => setUploadResult(null)}
                type={uploadResult && uploadResult.success ? 'success' : 'error'}
            >
                {uploadResult && (uploadResult.success || uploadResult.error)}
                {uploadResult && uploadResult.link && (
                    <div className="mt-2 flex flex-col sm:flex-row items-stretch">
                        <input
                            type="text"
                            value={uploadResult.link}
                            readOnly
                            className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-md sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                            onClick={() => copyToClipboard(uploadResult.link)}
                            className="mt-2 sm:mt-0 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md sm:rounded-l-none bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                        </button>
                    </div>
                )}
            </Alert>

            <Toast
                message="Link copied to clipboard!"
                show={showToast}
                onClose={() => setShowToast(false)}
            />

            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <Lock className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm">Your file is encrypted in your browser using AES-256 with a 512-bit derived key, combined with a post-quantum inspired method for enhanced future-proofing.</p>
                    </div>
                </div>
            </div>

            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
                <div className="flex items-center mb-2">
                    <div className="flex-shrink-0">
                        <FileText className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-bold">File size limit: 25MB</p>
                    </div>
                </div>
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm">Files are stored temporarily and will be automatically deleted after 6 hours.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadForm;