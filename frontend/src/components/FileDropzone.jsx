import { useRef, useState } from 'react';
import clsx from 'clsx';
import { FileText, Image as ImageIcon, UploadCloud, X } from 'lucide-react';
import { formatBytes } from '../utils/formatDate';
import { validateFile } from '../utils/validators';

export function FileDropzone({
  file,
  existingFile,
  onFileSelect,
  onRemoveFile,
  uploadProgress = 0,
  uploading = false,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState('');

  const activeFile = file || existingFile;

  const handleCandidate = (candidate) => {
    if (!candidate) return;
    const validation = validateFile(candidate);
    if (!validation.valid) {
      setFileError(validation.error);
      return;
    }
    setFileError('');
    onFileSelect(candidate);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer?.files?.[0];
    handleCandidate(dropped);
  };

  const handleInputChange = (event) => {
    const selected = event.target.files?.[0];
    handleCandidate(selected);
    event.target.value = '';
  };

  const isPdf = activeFile?.type === 'application/pdf' || activeFile?.name?.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-2.5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          'relative rounded-card border-2 border-dashed p-5 text-center transition-colors',
          dragging
            ? 'border-brand-blue bg-blue-50/70'
            : fileError
              ? 'border-semantic-danger bg-red-50/40'
              : 'border-border bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          onChange={handleInputChange}
          className="sr-only"
          aria-label="Upload certificate file"
        />

        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-surface border border-border shadow-card flex items-center justify-center text-brand-blue mb-2.5">
            <UploadCloud className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-ink-primary">
            Drag and drop your certificate, or{' '}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-brand-blue hover:text-blue-700 font-semibold underline-offset-2 hover:underline"
            >
              browse file
            </button>
          </p>
          <p className="text-xs text-ink-muted mt-1">PDF, PNG, or JPG up to 10 MB</p>
        </div>
      </div>

      {fileError && (
        <p role="alert" className="text-xs font-medium text-semantic-danger">
          {fileError}
        </p>
      )}

      {activeFile && (
        <div className="rounded-control bg-surface border border-border px-3.5 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={clsx(
                'w-9 h-9 rounded-control flex items-center justify-center shrink-0',
                isPdf ? 'bg-red-50 text-semantic-danger' : 'bg-blue-50 text-brand-blue'
              )}
            >
              {isPdf ? (
                <FileText className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ImageIcon className="w-4 h-4" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-primary truncate">{activeFile.name}</p>
              <p className="text-xs text-ink-muted">
                {formatBytes(activeFile.size)} {file ? '• Ready to save' : '• Attached'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setFileError('');
              onRemoveFile();
            }}
            aria-label="Remove attached file"
            disabled={uploading}
            className="p-1.5 rounded-control text-ink-muted hover:text-semantic-danger hover:bg-red-50 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-secondary">
            <span>Saving credential to vault...</span>
            <span className="tabular-nums font-medium">{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-pill bg-slate-200 overflow-hidden">
            <div
              className="h-full cv-brand-gradient transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
