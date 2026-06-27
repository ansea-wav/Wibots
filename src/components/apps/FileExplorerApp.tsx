'use client';
import { useState } from 'react';
import type { FileEntry, ClientRegistry } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

interface FileExplorerProps {
  client: ClientRegistry;
  files: FileEntry[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (filename: string) => Promise<void>;
  onCopyUrl: (url: string) => void;
  apiBase: string;
}

export default function FileExplorerApp({ client, files, onUpload, onDelete, onCopyUrl, apiBase }: FileExplorerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const { showToast, toastElement } = useToast();

  const formatSize = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const tier = client?.Package_Tier || 'Basic';
  const quotaMB = (tier === 'Premium' || tier === 'God') ? 1000 : (tier === 'Standard' || tier === 'Standart') ? 400 : 40;
  const quotaBytes = quotaMB * 1024 * 1024;
  const usedBytes = files.reduce((sum, f) => sum + (Number(f.size) || 0), 0);
  const percentUsed = Math.min(100, (usedBytes / quotaBytes) * 100);

  const getFileIcon = (f: FileEntry) => {
    const nameToCheck = f.filename || (f as any).name || f.url || '';
    const ext = nameToCheck.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return '🖼️';
    if (['pdf'].includes(ext || '')) return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['mp4', 'mov', 'avi'].includes(ext || '')) return '🎬';
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return '🎵';
    return '📁';
  };

  const isImage = (f: FileEntry) => {
    const nameToCheck = f.filename || (f as any).name || f.url || '';
    const ext = nameToCheck?.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  };

  const doUpload = async (file: File) => {
    setLoading(true);
    try {
      await onUpload(file);
      showToast('File berhasil diupload!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Gagal mengupload file.', 'error');
    }
    setLoading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    e.target.value = '';
  };

  const doDelete = async (filename: string) => {
    try {
      await onDelete(filename);
      showToast('File berhasil dihapus!', 'success');
      if (selectedFile?.filename === filename) setSelectedFile(null);
    } catch (e: any) {
      showToast(e.message || 'Gagal menghapus file.', 'error');
    }
  };

  const handleCopy = (url: string) => {
    const fullUrl = `${apiBase}${url}`;
    navigator.clipboard.writeText(fullUrl);
    onCopyUrl(fullUrl);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(''), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      
      {/* Storage and View Card */}
      <div className="bg-[#fdfcf7] border border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] space-y-6">
        
        {/* Storage Info Header */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-xs text-zinc-400 uppercase tracking-widest font-black mb-1">
                Google Drive Storage
              </div>
              <div className="text-[11px] text-zinc-500 font-semibold flex gap-2">
                <span>{files.length} files</span>
                <span>•</span>
                <span>{formatSize(usedBytes)} / {quotaMB} MB used</span>
              </div>
            </div>
            <span className="text-[9px] font-bold text-zinc-50 bg-zinc-950 px-2.5 py-0.5 rounded-full uppercase border border-zinc-800">
              {tier}
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-200/60 rounded-full overflow-hidden flex">
            <div 
              className={`h-full transition-all duration-500 ${
                percentUsed > 90 
                  ? 'bg-rose-500' 
                  : percentUsed > 70 
                    ? 'bg-amber-500' 
                    : 'bg-zinc-950'
              }`} 
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-t border-zinc-200/40 pt-4">
          <div className="flex rounded-full border border-zinc-250 overflow-hidden p-0.5 bg-zinc-50">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/50' 
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/50' 
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              List
            </button>
          </div>
          
          <label className={`px-4 py-1.5 rounded-full text-xs font-bold bg-zinc-950 hover:bg-zinc-900 text-white transition-all shadow-sm cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {loading ? '⏳ Uploading...' : '📤 Upload File'}
            <input type="file" className="hidden" onChange={handleFileInput} disabled={loading} />
          </label>
        </div>

        {/* Drop Zone / File Grid */}
        <div
          className={`border-2 border-dashed rounded-2xl p-4 transition-colors ${
            dragOver 
              ? 'border-zinc-950 bg-zinc-50' 
              : 'border-zinc-300 hover:border-zinc-400'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-5xl mb-4 opacity-20">📂</div>
              <div className="text-sm font-bold text-zinc-400 mb-1">No files uploaded</div>
              <div className="text-[10px] text-zinc-400">Drag &amp; drop files here or click Upload</div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3.5">
              {files.map((f) => (
                <div
                  key={f.filename}
                  className={`group p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedFile?.filename === f.filename
                      ? 'border-zinc-950 bg-zinc-100 shadow-[2px_2px_0px_#000000]'
                      : 'border-zinc-950 bg-white hover:bg-zinc-50/50 shadow-[3px_3px_0px_#09090b]'
                  }`}
                  onClick={() => setSelectedFile(f)}
                >
                  {/* Preview Box */}
                  <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 flex items-center justify-center relative bg-zinc-100 border border-zinc-200/40">
                    {isImage(f) ? (
                      <img 
                        src={f.id ? `https://drive.google.com/uc?export=view&id=${f.id}` : f.url.startsWith('http') ? f.url : `${apiBase}${f.url}`} 
                        alt={f.filename || 'image'} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-3xl">{getFileIcon(f)}</span>
                    )}
                    
                    {/* Hover Actions Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          const fullUrl = f.id ? `https://drive.google.com/uc?export=download&id=${f.id}` : f.url.startsWith('http') ? f.url : `${apiBase}${f.url}`;
                          window.open(fullUrl, '_blank');
                        }}
                        className="p-1.5 rounded-full bg-white/90 hover:bg-white text-zinc-900 transition-colors flex items-center justify-center"
                        title="Download"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(f.url); }}
                        className="p-1.5 rounded-full bg-white/90 hover:bg-white text-zinc-900 transition-colors flex items-center justify-center"
                        title="Copy URL"
                      >
                        {copiedUrl === f.url 
                          ? <span className="material-symbols-outlined text-[16px] text-emerald-600 font-bold">check</span> 
                          : <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        }
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); doDelete(f.filename); }}
                        className="p-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors flex items-center justify-center"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-[11px] text-zinc-900 truncate font-bold ml-0.5">{f.filename || (f as any).name || 'Unknown File'}</div>
                  <div className="text-[9px] text-zinc-500 font-semibold ml-0.5">{formatSize(f.size)}</div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-1.5">
              {files.map((f) => (
                <div
                  key={f.filename}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 transition-colors group cursor-pointer border border-zinc-200/50 hover:border-zinc-400"
                  onClick={() => setSelectedFile(f)}
                >
                  <span className="text-xl shrink-0">{getFileIcon(f)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-900 font-bold truncate">{f.filename || (f as any).name || 'Unknown File'}</div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">{formatSize(f.size)}</div>
                  </div>
                  
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const fullUrl = f.id ? `https://drive.google.com/uc?export=download&id=${f.id}` : f.url.startsWith('http') ? f.url : `${apiBase}${f.url}`;
                        window.open(fullUrl, '_blank');
                      }}
                      className="px-3 py-1 rounded-full text-[10px] font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 transition-colors cursor-pointer"
                    >
                      Download
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(f.url); }}
                      className="px-3 py-1 rounded-full text-[10px] font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 transition-colors cursor-pointer"
                    >
                      {copiedUrl === f.url ? '✓ Copied' : 'Copy URL'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); doDelete(f.filename); }}
                      className="px-3 py-1 rounded-full text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toastElement}
    </div>
  );
}
