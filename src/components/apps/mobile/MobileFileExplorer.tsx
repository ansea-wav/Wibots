'use client';
import { useState } from 'react';
import type { FileEntry, ClientRegistry } from '@/lib/api';

interface FileExplorerProps {
  client: ClientRegistry;
  files: FileEntry[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (filename: string) => Promise<void>;
  onCopyUrl: (url: string) => void;
  apiBase: string;
}

export default function MobileFileExplorer({ client, files, onUpload, onDelete, onCopyUrl, apiBase }: FileExplorerProps) {
  const [loading, setLoading] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const tier = client?.Package_Tier || 'Basic';
  const quotaMB = (tier === 'Premium' || tier === 'God') ? 1000 : (tier === 'Standard' || tier === 'Standart') ? 400 : 40;
  const quotaBytes = quotaMB * 1024 * 1024;
  const usedBytes = files.reduce((sum, f) => sum + f.size, 0);
  const percentUsed = Math.min(100, (usedBytes / quotaBytes) * 100);

  const isImage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  };

  const doUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      await onUpload(file);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#111113]">
      {/* Storage Card */}
      <div className="p-5 mx-4 mt-2 mb-6 rounded-3xl border border-white/5 bg-[#1a1a1c] shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <span className="material-symbols-outlined text-2xl">cloud</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Storage</h2>
              <div className="text-xs text-white/50">{formatSize(usedBytes)} / {quotaMB} MB used</div>
            </div>
          </div>
        </div>
        <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${percentUsed > 90 ? 'bg-red-500' : percentUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'}`} 
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>

      {/* Upload Button */}
      <div className="px-4 mb-6">
        <label className={`flex items-center justify-center gap-3 w-full p-4 rounded-2xl bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform ${loading ? 'opacity-70 pointer-events-none' : ''}`}>
          <span className="material-symbols-outlined">{loading ? 'hourglass_empty' : 'upload_file'}</span>
          {loading ? 'Uploading...' : 'Upload File'}
          <input type="file" className="hidden" onChange={doUpload} disabled={loading} />
        </label>
      </div>

      {/* File List */}
      <div className="flex-1 px-4 overflow-y-auto pb-6">
        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Your Files ({files.length})</h3>
        
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="material-symbols-outlined text-6xl text-white/10 mb-4">folder_open</span>
            <div className="text-white/50 text-sm">No files uploaded yet</div>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((f) => (
              <div key={f.filename} className="p-4 rounded-2xl border border-white/5 bg-[#1a1a1c] flex items-center gap-4">
                {/* File Preview/Icon */}
                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                  {isImage(f.filename) ? (
                    <img src={f.id ? `https://drive.google.com/uc?export=view&id=${f.id}` : f.url.startsWith('http') ? f.url : `${apiBase}${f.url}`} alt={f.filename} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-2xl text-white/50">description</span>
                  )}
                </div>
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-white truncate">{f.filename}</div>
                  <div className="text-xs text-white/50 mt-1">{formatSize(f.size)}</div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => {
                      const fullUrl = `${apiBase}${f.url}`;
                      navigator.clipboard.writeText(fullUrl);
                      onCopyUrl(fullUrl);
                    }} 
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 active:bg-white/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">content_copy</span>
                  </button>
                  <button onClick={() => onDelete(f.filename)} 
                    className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 active:bg-red-500/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
