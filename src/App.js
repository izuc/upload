import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { Upload, Search, Lock, Github } from 'lucide-react';
import UploadForm from './components/UploadForm';
import FileViewer from './components/FileViewer';

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive
          ? 'bg-purple-600 text-white'
          : 'text-purple-600 hover:bg-purple-100'
        }`}
    >
      {children}
    </Link>
  );
};

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full space-y-6 relative">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Lock className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-center text-gray-800">upload.computer</h1>
          </div>

          <nav className="flex justify-center space-x-4 bg-gray-100 p-2 rounded-md mb-6">
            <NavLink to="/">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </NavLink>
            <NavLink to="/view">
              <Search className="w-4 h-4 mr-2" />
              View File
            </NavLink>
          </nav>

          <Routes>
            <Route path="/" element={<UploadForm />} />
            <Route path="/view" element={<FileViewer />} />
            <Route path="/view/:fileId" element={<FileViewer />} />
          </Routes>

          <div className="absolute bottom-2 right-2 text-sm text-gray-500">
            Created by <a href="https://lance.name" className="text-purple-600 hover:text-purple-800 underline" target="_blank" rel="noopener noreferrer">Lance</a>
          </div>

          <div className="absolute bottom-2 left-2">
            <a href="https://github.com/izuc/upload" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-purple-600 transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;