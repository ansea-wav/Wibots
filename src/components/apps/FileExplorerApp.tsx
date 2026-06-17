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
    <div className="flex flex-col h-full" style={{ background: 'var(--surface-panel)' }}>
      {/* Storage Progress Bar Area */}
      <div className="px-4 pt-4 pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-sm font-bold text-white mb-0.5">Google Drive Storage</h2>
            <div className="text-[10px] text-[var(--text-tertiary)] flex gap-2">
              <span>{files.length} files</span>
              <span>•</span>
              <span>{formatSize(usedBytes)} / {quotaMB} MB used</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-[var(--text-secondary)] bg-white/5 px-2 py-0.5 rounded uppercase">
            {tier}
          </span>
        </div>
        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden flex">
          <div 
            className={`h-full transition-all duration-500 ${percentUsed > 90 ? 'bg-red-500' : percentUsed > 70 ? 'bg-yellow-500' : 'bg-[var(--neon-green)]'}`} 
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex rounded-lg border border-[var(--border-subtle)] overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2 py-1 text-[10px] cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-[var(--text-tertiary)]'}`}
          >
            ▦
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-2 py-1 text-[10px] cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-[var(--text-tertiary)]'}`}
          >
            ☰
          </button>
        </div>
        <label className={`px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--neon-green)]/15 text-[var(--neon-green)] border border-[var(--neon-green)]/20 cursor-pointer hover:bg-[var(--neon-green)]/25 transition-all ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          {loading ? '⏳ Uploading...' : '📤 Upload File'}
          <input type="file" className="hidden" onChange={handleFileInput} disabled={loading} />
        </label>
      </div>

      {/* Drop Zone / File Content */}
      <div
        className={`flex-1 overflow-auto px-4 pb-4 transition-colors ${dragOver ? 'bg-[var(--neon-green)]/5' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4 opacity-20">📂</div>
            <div className="text-sm text-[var(--text-tertiary)] mb-1">No files uploaded</div>
            <div className="text-[10px] text-[var(--text-tertiary)]">Drag &amp; drop files here or click Upload</div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-3 gap-3">
            {files.map((f) => (
              <div
                key={f.filename}
                className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedFile?.filename === f.filename
                    ? 'border-[var(--neon-green)]/30 bg-[var(--neon-green)]/5'
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-medium)] bg-[var(--surface-glass)]'
                }`}
                onClick={() => setSelectedFile(f)}
              >
                {/* Preview */}
                <div className="w-full aspect-square rounded-lg overflow-hidden mb-2 flex items-center justify-center relative"
                  style={{ background: 'rgba(0,0,0,0.3)' }}>
                  {isImage(f) ? (
                    <img src={f.id ? `https://drive.google.com/uc?export=view&id=${f.id}` : f.url.startsWith('http') ? f.url : `${apiBase}${f.url}`} alt={f.filename || 'image'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">{getFileIcon(f)}</span>
                  )}
                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const fullUrl = f.id ? `https://drive.google.com/uc?export=download&id=${f.id}` : f.url.startsWith('http') ? f.url : `${apiBase}${f.url}`;
                        window.open(fullUrl, '_blank');
                      }}
                      className="p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 transition-colors"
                      title="Download"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(f.url); }}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center"
                      title="Copy URL"
                    >
                      {copiedUrl === f.url ? <span className="material-symbols-outlined text-sm">check</span> : <span className="material-symbols-outlined text-sm">content_copy</span>}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); doDelete(f.filename); }}
                      className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-white truncate font-medium">{f.filename || (f as any).name || 'Unknown File'}</div>
                <div className="text-[10px] text-[var(--text-tertiary)]">{formatSize(f.size)}</div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-1">
            {files.map((f) => (
              <div
                key={f.filename}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors group cursor-pointer border border-transparent hover:border-white/5"
                onClick={() => setSelectedFile(f)}
              >
                <span className="text-lg">{getFileIcon(f)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">{f.filename || (f as any).name || 'Unknown File'}</div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">{formatSize(f.size)}</div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const fullUrl = f.id ? `https://drive.google.com/uc?export=download&id=${f.id}` : f.url.startsWith('http') ? f.url : `${apiBase}${f.url}`;
                      window.open(fullUrl, '_blank');
                    }}
                    className="px-2 py-1 rounded text-[10px] text-blue-400 hover:bg-blue-400/10 cursor-pointer transition-colors"
                  >
                    Down
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(f.url); }}
                    className="px-2 py-1 rounded text-[10px] text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10 cursor-pointer transition-colors"
                  >
                    {copiedUrl === f.url ? '✓' : 'Copy'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); doDelete(f.filename); }}
                    className="px-2 py-1 rounded text-[10px] text-[var(--neon-red)] hover:bg-[var(--neon-red)]/10 cursor-pointer transition-colors"
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toastElement}
    </div>
  );
}
