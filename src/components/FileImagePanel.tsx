import { useState, useRef } from 'react';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

function FileImagePanel() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scraperTemplates, setScraperTemplates] = useState([{ id: 1, name: 'Scraper 1' }]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    
    const newFiles = Array.from(fileList).map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleScrape = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Scraping files:', files);
    } catch (error) {
      console.error('File scraping failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScreenshot = () => {
    console.log('Taking screenshot...');
    alert('Screenshot functionality will be implemented');
  };

  const addNewScraperTemplate = () => {
    const newId = scraperTemplates.length + 1;
    setScraperTemplates([...scraperTemplates, { id: newId, name: `Scraper ${newId}` }]);
  };

  const deleteScraperTemplate = (id: number) => {
    if (scraperTemplates.length > 1) {
      setScraperTemplates(scraperTemplates.filter(template => template.id !== id));
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Step 1: Choose a Data Source */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            1
          </div>
          <h2 className="text-lg font-semibold text-white">Choose a Data Source</h2>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-purple-500 bg-purple-500/10' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-gray-400 font-medium">Drag & Drop Files Here</span>
              <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center"></div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-xs mx-auto px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span className="text-lg">⬆️</span>
              <span>Upload</span>
            </button>

            <button
              onClick={handleScreenshot}
              className="w-full max-w-xs mx-auto px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span className="text-lg">✂️</span>
              <span>Screenshot</span>
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.html,.jpg,.jpeg,.png,.gif"
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium">Uploaded Files ({files.length})</h3>
            <button
              onClick={() => setFiles([])}
              className="text-red-400 hover:text-red-300 text-sm transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-2xl">
                    {file.type.startsWith('image/') ? '🖼️' : 
                     file.type.includes('pdf') ? '📄' : 
                     file.type.includes('doc') ? '📝' : 
                     file.type.includes('text') ? '📃' : '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{file.name}</p>
                    <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="w-5 h-5 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select a Scraper Template */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              2
            </div>
            <h2 className="text-lg font-semibold text-white">Select a Scraper Template</h2>
          </div>
          <button
            className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 text-sm"
            onClick={addNewScraperTemplate}
          >
            <span>+</span>
            <span>New Scraper Template</span>
          </button>
        </div>

        {scraperTemplates.map(template => (
          <div key={template.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-4">
            <div className="flex items-center space-x-6 mb-4">
              <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-white font-medium">{template.name}</span>
              <div className="ml-auto flex items-center space-x-2">
                <button
                  className="w-5 h-5 text-gray-400 hover:text-red-400 transition-colors"
                  onClick={() => deleteScraperTemplate(template.id)}
                  title="Delete scraper template"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-400 mb-3">Get started with</div>
              
              <button className="w-full p-3 rounded-lg border-2 border-purple-600 bg-purple-600/10 transition-colors hover:bg-purple-600/20">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-purple-400">✨</span>
                  <span className="text-white">AI Suggest Fields</span>
                </div>
              </button>

              <div className="text-center text-gray-500 text-sm py-2">OR</div>

              <button className="w-full p-3 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-colors hover:bg-gray-700/50">
                <div className="flex items-center justify-center space-x-2">
                  <span>📝</span>
                  <span className="text-white">Enter Manually</span>
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Scrape Button */}
      <button
        onClick={handleScrape}
        disabled={isLoading || files.length === 0}
        className={`mt-8 w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
          isLoading || files.length === 0
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Processing {files.length} files...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <span>📋</span>
            <span>Extract from {files.length > 0 ? `${files.length} files` : 'Files'}</span>
          </div>
        )}
      </button>
    </div>
  );
}

export default FileImagePanel;
