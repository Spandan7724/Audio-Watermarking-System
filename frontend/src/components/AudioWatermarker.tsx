'use client';

import React, { useState, useRef, HTMLAttributes } from 'react'; // Added HTMLAttributes
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Download, Siren, CheckCircle2, XCircle, Loader2, Music, RotateCcw, FileAudio, FolderOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';


// Define a custom type for input elements with webkitdirectory attribute
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}

// Extended File interface to include webkitRelativePath
interface FileWithPath extends Omit<File, 'webkitRelativePath'> {
  webkitRelativePath: string;
}

// Type definitions based on Python Pydantic models
interface EmbedResponse {
    filename: string;
    download_url: string;
    rms: number;
    si_snr: number;
}

/** ─── NEW ───  shape returned by the backend when a folder is embedded */
interface BatchEmbedResponse {
  results: EmbedResponse[];
  zip_download_url?: string;   // null / undefined if nothing to zip
}

interface DetectResponse {
    filename: string;
    probability: number;
    is_watermarked: boolean;
}

// Define error types for API responses
interface ApiError {
    detail?: string | Array<{loc: string[], msg: string}> | unknown;
}

// Get API URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const isAudio = (f: File) =>
  f.type.startsWith('audio/') || /\.(wav|flac|mp3|ogg|opus|m4a)$/i.test(f.name);

export function AudioWatermarker() {
    const [activeTab, setActiveTab] = useState<'embed' | 'detect'>('embed');

    // File selection mode state (folder or individual files)
    const [folderMode, setFolderMode] = useState<boolean>(false);

    // Embed State
    const [embedFiles, setEmbedFiles] = useState<FileWithPath[]>([]);
    const [embedResults, setEmbedResults] = useState<EmbedResponse[]>([]);
    const [batchDownloadUrl, setBatchDownloadUrl] = useState<string | null>(null); // <- EDIT 2: Added state
    const [isEmbedding, setIsEmbedding] = useState(false);
    const [embedError, setEmbedError] = useState<string | null>(null);
    const embedInputRef = useRef<HTMLInputElement>(null);
    const embedFolderInputRef = useRef<HTMLInputElement>(null);

    // Detect State
    const [detectFiles, setDetectFiles] = useState<FileWithPath[]>([]);
    const [detectResults, setDetectResults] = useState<DetectResponse[]>([]);
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectError, setDetectError] = useState<string | null>(null);
    const detectInputRef = useRef<HTMLInputElement>(null);
    const detectFolderInputRef = useRef<HTMLInputElement>(null);

    // --- Handlers ---

    // Handles selecting files (either individual or folders)
    const handleFileChange = (
      event: React.ChangeEvent<HTMLInputElement>,
      type: 'embed' | 'detect'
    ) => {
      const files = event.target.files
        ? Array.from(event.target.files).filter(isAudio) as FileWithPath[]
        : [];

      const invalidFiles = event.target.files
        ? Array.from(event.target.files).length - files.length
        : 0;

      const errorMsg = (invalidFiles > 0 && files.length === 0) ? 'No audio files found. Please select audio files.' : null;

      if (type === 'embed') {
        setEmbedFiles(files);
        setEmbedResults([]);    // clear old results
        setBatchDownloadUrl(null); // clear old batch url
        setEmbedError(errorMsg); // Show warning if some files ignored, clear previous API errors
      } else {
        setDetectFiles(files);
        setDetectResults([]);
        setDetectError(errorMsg); // Show warning if some files ignored, clear previous API errors
      }
      // reset input so same folder re-upload triggers change event next time
      if (event.target) event.target.value = '';
    };

    const handleDrop = (
        event: React.DragEvent<HTMLDivElement>,
        type: 'embed' | 'detect'
    ) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('border-primary', 'bg-primary/10');

        const droppedFiles = event.dataTransfer.files
            ? Array.from(event.dataTransfer.files).filter(isAudio) as FileWithPath[]
            : [];

        const invalidFiles = event.dataTransfer.files
            ? Array.from(event.dataTransfer.files).length - droppedFiles.length
            : 0;

        const errorMsg = (invalidFiles > 0 && droppedFiles.length === 0) ? 'No audio files found. Please select audio files.' : null;

        if (droppedFiles.length > 0) {
             if (type === 'embed') {
                setEmbedFiles(droppedFiles);
                setEmbedResults([]); // Clear results
                setBatchDownloadUrl(null); // Clear old batch url
                setEmbedError(errorMsg); // Show warning or clear error
            } else {
                setDetectFiles(droppedFiles);
                setDetectResults([]); // Clear results
                setDetectError(errorMsg); // Show warning or clear error
            }
        } else if (invalidFiles > 0) {
            // Only invalid files dropped
            if (type === 'embed') {
                setEmbedFiles([]);
                setEmbedResults([]);
                setBatchDownloadUrl(null);
                setEmbedError("Invalid file type(s). Please drop audio files.");
            } else {
                setDetectFiles([]);
                setDetectResults([]);
                setDetectError("Invalid file type(s). Please drop audio files.");
            }
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.add('border-primary', 'bg-primary/10');
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('border-primary', 'bg-primary/10');
    };

    // Trigger file input based on mode (folder or individual files)
    const triggerFileInput = (type: 'embed' | 'detect') => {
        if (type === 'embed') {
            if (folderMode) {
                embedFolderInputRef.current?.click();
            } else {
                embedInputRef.current?.click();
            }
        } else {
            if (folderMode) {
                detectFolderInputRef.current?.click();
            } else {
                detectInputRef.current?.click();
            }
        }
    };

    const parseApiError = (data: ApiError, status: number): string => {
        let errorMsg = `HTTP error! status: ${status}`;
        if (data?.detail) {
            if (typeof data.detail === 'string') {
                errorMsg = data.detail;
            } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
                // Handle potential missing loc or msg properties defensively
                errorMsg = data.detail.map((err: { loc?: string[], msg?: string }) => `${(err.loc || ['unknown']).join('.')}: ${err.msg || 'Unknown error'}`).join(', ');
            } else {
                try { errorMsg = JSON.stringify(data.detail); } catch { /* Ignore stringify error */ }
            }
        }
        // Fallback if detail parsing didn't yield a better message
        if (errorMsg === `HTTP error! status: ${status}` && data && typeof data === 'object') {
             try { errorMsg = JSON.stringify(data); } catch { /* Ignore */ }
        }
        return errorMsg;
    }

    const handleEmbedFolder = async () => {
        if (embedFiles.length === 0) return;
        setIsEmbedding(true);
        setEmbedError(null);
        setEmbedResults([]); // Clear previous results
        setBatchDownloadUrl(null); // Clear previous batch url

        const form = new FormData();
        embedFiles.forEach(file => {
            form.append('files', file, file.webkitRelativePath || file.name);
        });

        try {
            const res = await fetch(`${API_BASE_URL}/embed/folder`, {
                method: 'POST',
                body: form,
            });

            // --- START FIX for TS Error ---
            // Parse the JSON body first
            const responseData = await res.json();

            if (!res.ok) {
                // If response is not OK, assume responseData is an ApiError
                // and parse it using your helper
                const errorPayload = responseData as ApiError; // Cast to ApiError for the parser
                throw new Error(parseApiError(errorPayload, res.status));
            }

            // If response is OK, *now* we know it's a BatchEmbedResponse
            const successData = responseData as BatchEmbedResponse; // Cast to the expected success type
            setEmbedResults(successData.results);
            setBatchDownloadUrl(successData.zip_download_url ?? null);
            // --- END FIX for TS Error ---

        } catch (err: unknown) {
            console.error('Embedding failed:', err);
            // Ensure error message passed to state is always a string
            if (err instanceof Error) {
                setEmbedError(err.message);
            } else {
                setEmbedError('An unknown error occurred during embedding.');
            }
        } finally {
            setIsEmbedding(false);
        }
    };

    const handleDetectFolder = async () => {
        if (detectFiles.length === 0) return;
        setIsDetecting(true);
        setDetectError(null);
        setDetectResults([]); // Clear previous results

        const form = new FormData();
        detectFiles.forEach(file => {
            form.append('files', file, file.webkitRelativePath || file.name);
        });

        try {
            const res = await fetch(`${API_BASE_URL}/detect/folder`, {
                method: 'POST',
                body: form,
            });
             // --- Similar fix applied here for consistency ---
            const responseData = await res.json();

            if (!res.ok) {
                const errorPayload = responseData as ApiError;
                throw new Error(parseApiError(errorPayload, res.status));
            }

            // Assuming the detect endpoint returns { results: DetectResponse[] } on success
            // Adjust if the actual success structure is different
            if (responseData && Array.isArray(responseData.results)) {
                 setDetectResults(responseData.results as DetectResponse[]);
            } else {
                // Handle unexpected success structure if necessary
                console.warn("Unexpected success response structure from /detect/folder:", responseData);
                setDetectResults([]); // Or set an appropriate error
            }
             // --- End similar fix ---

        } catch (err: unknown) {
            console.error('Detection failed:', err);
             if (err instanceof Error) {
                setDetectError(err.message);
            } else {
                 setDetectError('An unknown error occurred during detection.');
            }
        } finally {
            setIsDetecting(false);
        }
    };

    // Fixed download function that properly constructs the URL
    const handleDownload = async (downloadUrl: string, originalName: string) => {
    // 1️⃣  fetch the file as a Blob (same-origin cookies/CORS headers still apply)
    const res = await fetch(`${API_BASE_URL}${downloadUrl}`);
    if (!res.ok) {
        console.error('Download failed:', res.status);
        return;
    }
    const blob = await res.blob();

    // 2️⃣  build a filename (add _wm before the ext unless it’s already .zip)
    const filename = originalName.endsWith('.zip')
        ? originalName
        : originalName.replace(/(\.[^.]+)$/, '_wm$1');

    // 3️⃣  create an object-URL and force a user-initiated download
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    };

    const resetState = (type: 'embed' | 'detect') => {
        if (type === 'embed') {
            setEmbedFiles([]);
            setEmbedResults([]);
            setBatchDownloadUrl(null);   // <── EDIT 5: Clear extra state (already present)
            setEmbedError(null);
            setIsEmbedding(false);
            if (embedInputRef.current) embedInputRef.current.value = '';
            if (embedFolderInputRef.current) embedFolderInputRef.current.value = '';
        } else {
            setDetectFiles([]);
            setDetectResults([]);
            setDetectError(null);
            setIsDetecting(false);
            if (detectInputRef.current) detectInputRef.current.value = '';
            if (detectFolderInputRef.current) detectFolderInputRef.current.value = '';
        }
    }

    const renderDropZone = (type: 'embed' | 'detect') => {
        const files = type === 'embed' ? embedFiles : detectFiles;
        const fileSelectionError = type === 'embed' ? embedError : detectError;
        // Check specifically if the error is a file selection error AND no files are present
        const isFileSelectionErrorActive = (fileSelectionError === 'No audio files found. Please select audio files.' || fileSelectionError === "Invalid file type(s). Please drop audio files.") && files.length === 0;

        return (
            <div>
                {/* Mode toggle button */}
                <div className="flex justify-end mb-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFolderMode(!folderMode)}
                        className="!bg-black !text-white hover:!bg-black hover:!text-white"
                    >
                        {folderMode ? (
                            <>
                                <PanelRightOpen className="w-3 h-3 mr-1" />
                                <span>Folder Mode</span>
                            </>
                        ) : (
                            <>
                                <PanelRightClose className="w-3 h-3 mr-1" />
                                <span>File Mode</span>
                            </>
                        )}
                    </Button>
                </div>

                {/* Drop zone */}
                <div
                    className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors min-h-[180px] ${
                        isFileSelectionErrorActive ? 'border-destructive hover:border-destructive/80 bg-destructive/10' : 'border-muted-foreground/50 hover:border-primary hover:bg-primary/10'
                    }`}
                    onClick={() => triggerFileInput(type)}
                    onDrop={(e) => handleDrop(e, type)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    {/* Inputs */}
                    <input
                        type="file"
                        ref={type === 'embed' ? embedInputRef : detectInputRef}
                        onChange={(e) => handleFileChange(e, type)}
                        multiple
                        accept=".wav,.mp3,.flac,.ogg,audio/*"
                        className="hidden"
                        id={`file-upload-${type}`}
                    />
                    <input
                        type="file"
                        ref={type === 'embed' ? embedFolderInputRef : detectFolderInputRef}
                        onChange={(e) => handleFileChange(e, type)}
                        webkitdirectory=""
                        directory=""
                        multiple
                        // Note: accept on directory input might not be universally effective
                        // Filtering happens in handleFileChange
                        className="hidden"
                        id={`folder-upload-${type}`}
                    />

                    {/* Content */}
                    <Upload className={`w-12 h-12 mb-4 ${isFileSelectionErrorActive ? 'text-destructive' : 'text-muted-foreground'}`} />
                    {files.length > 0 ? (
                        <>
                            <p className="text-center font-medium text-sm">{files.length} audio file(s) selected</p>
                            <p className="text-xs text-muted-foreground mt-1">Click or drag {folderMode ? 'folder' : 'files'} to replace</p>
                            {/* Only show file *selection* errors here if there are *no* files */}
                             {isFileSelectionErrorActive && <p className="text-xs text-destructive mt-2">{fileSelectionError}</p>}
                        </>
                    ) : (
                        <>
                            <p className="text-center font-medium">Drag audio {folderMode ? 'folder' : 'files'} here</p>
                            <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {folderMode ? 'Folder mode: select entire directory' : 'File mode: select individual audio files'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Supports WAV, MP3, FLAC, etc.</p>
                             {/* Show file selection errors here if no files are selected */}
                             {isFileSelectionErrorActive && <p className="text-xs text-destructive mt-2">{fileSelectionError}</p>}
                        </>
                    )}
                </div>
            </div>
        );
    };

    const renderErrorAlert = (type: 'embed' | 'detect') => {
        const error = type === 'embed' ? embedError : detectError;
        const files = type === 'embed' ? embedFiles : detectFiles;
        const results = type === 'embed' ? embedResults : detectResults;

        // Don't show if no error, or if results are already displayed (assume error is stale)
        if (!error || results.length > 0) return null;

        // Don't show file selection errors here if no files are selected (handled in DropZone)
        const isFileSelectionError = error === 'No audio files found. Please select audio files.' || error === "Invalid file type(s). Please drop audio files.";
        if (isFileSelectionError && files.length === 0) return null;

        // Show API errors or file selection errors *if files are present*
        return (
            <Alert variant="destructive" className="mt-4">
                <Siren className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }


    // --- JSX Structure (largely unchanged, includes previous edits) ---
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-center sm:text-left">Audio Watermarking</h1>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'embed' | 'detect')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="embed">
                        <Music className="w-4 h-4 mr-2" /> Embed Watermark
                    </TabsTrigger>
                    <TabsTrigger value="detect">
                        <Siren className="w-4 h-4 mr-2" /> Detect Watermark
                    </TabsTrigger>
                </TabsList>

                {/* Embed Tab */}
                <TabsContent value="embed" className="space-y-6">
                    <Card className="bg-neutral-50">
                        <CardHeader>
                            <CardTitle className="text-black flex items-center gap-2">
                                {folderMode ? <FolderOpen className="w-5 h-5"/> : <FileAudio className="w-5 h-5"/>}
                                Upload Audio for Embedding
                            </CardTitle>
                            <CardDescription>
                                {folderMode
                                    ? "Select or drop an audio folder containing multiple audio files."
                                    : "Select or drop individual audio files."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderDropZone('embed')}
                            {/* Error rendering now handled inside renderDropZone for file selection errors when no files exist */}
                        </CardContent>
                    </Card>

                    <Card className="bg-muted">
                        <CardHeader>
                            <CardTitle>Process & Results</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 min-h-[60px]">
                            {/* Render API errors or file errors *if files are present* */}
                            {renderErrorAlert('embed')}

                            {isEmbedding && (
                                <div className="flex items-center justify-center text-muted-foreground pt-4">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Embedding watermark(s)... Processing {embedFiles.length} file(s). Please wait.
                                </div>
                            )}

                            {embedResults.length > 0 && !isEmbedding && ( // Only show results if not loading
                                <div className="space-y-4 pt-4">
                                     {/* EDIT 4: Show Download All Button (already present) */}
                                    {batchDownloadUrl && (
                                      <Button
                                        className="mb-4 w-full sm:w-auto"
                                        onClick={() => handleDownload(batchDownloadUrl, 'watermarked_audio.zip')}
                                      >
                                        <Download className="w-4 h-4 mr-1" />
                                        Download All ({embedResults.length})
                                      </Button>
                                    )}

                                    <h3 className="text-lg font-semibold mb-2">Embedding Results:</h3>
                                    {embedResults.map((result, i) => (
                                        <Card key={result.filename || i} className="bg-background">
                                            <CardHeader className="py-3 px-4">
                                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> {result.filename}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="px-4 pb-3 text-xs space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Watermark RMS:</span>
                                                    <span className="font-mono">{result.rms.toFixed(6)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">SI-SNR:</span>
                                                    <span className="font-mono">{result.si_snr.toFixed(2)} dB</span>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="px-4 pb-3 pt-0">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDownload(result.download_url, result.filename)}
                                                    disabled={!result.download_url} // Disable if no URL
                                                >
                                                    <Download className="w-3 h-3 mr-1" /> Download
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>

                         {/* Footer Logic - Conditional Rendering */}
                         {/* Case 1: Files selected, no process running, no results yet, no API error shown */}
                         {embedFiles.length > 0 && !isEmbedding && embedResults.length === 0 && !embedError &&(
                           <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                               <Button variant="outline" onClick={() => resetState('embed')} disabled={isEmbedding}>
                                   <RotateCcw className="w-4 h-4 mr-2"/> Reset Selection
                               </Button>
                               <Button onClick={handleEmbedFolder} disabled={isEmbedding || embedFiles.length === 0}>
                                   <FileAudio className="mr-2 h-4 w-4" />
                                   Generate Watermarked Audio ({embedFiles.length})
                               </Button>
                           </CardFooter>
                        )}

                        {/* Case 2: Process finished (results OR API error shown), not currently processing */}
                         {((embedResults.length > 0 || (embedError && embedFiles.length > 0)) && !isEmbedding) && (
                            <CardFooter className="flex justify-end gap-2 pt-4">
                               <Button variant="outline" onClick={() => resetState('embed')}>
                                   <RotateCcw className="w-4 h-4 mr-2"/> Reset & Start Over
                               </Button>
                            </CardFooter>
                        )}
                    </Card>
                </TabsContent>

                {/* Detect Tab */}
                <TabsContent value="detect" className="space-y-6">
                     <Card className="bg-neutral-50">
                        <CardHeader>
                            <CardTitle className="text-black flex items-center gap-2">
                                {folderMode ? <FolderOpen className="w-5 h-5"/> : <FileAudio className="w-5 h-5"/>}
                                Upload Audio for Detection
                            </CardTitle>
                            <CardDescription>
                                {folderMode
                                    ? "Select or drop an audio folder containing multiple audio files."
                                    : "Select or drop individual audio files."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderDropZone('detect')}
                             {/* Error rendering now handled inside renderDropZone for file selection errors when no files exist */}
                        </CardContent>
                    </Card>

                     <Card className="bg-muted">
                        <CardHeader>
                            <CardTitle>Process & Results</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 min-h-[60px]">
                             {/* Render API errors or file errors *if files are present* */}
                             {renderErrorAlert('detect')}

                            {isDetecting && (
                                <div className="flex items-center justify-center text-muted-foreground pt-4">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Detecting watermark(s)... Processing {detectFiles.length} file(s). Please wait.
                                </div>
                            )}

                            {detectResults.length > 0 && !isDetecting && ( // Only show results if not loading
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-lg font-semibold mb-2">Detection Results:</h3>
                                    {detectResults.map((result, i) => {
                                        const isWatermarked = result.is_watermarked;
                                        const probabilityPercent = (result.probability * 100).toFixed(1);
                                        return (
                                            <Card key={result.filename || i} className="bg-background">
                                                <CardHeader className="py-3 px-4">
                                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                        {isWatermarked
                                                            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                            : <XCircle className="w-4 h-4 text-red-500" />
                                                        }
                                                        {result.filename}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="px-4 pb-3 text-xs space-y-1">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Probability:</span>
                                                        <span className={`font-mono font-semibold ${isWatermarked ? 'text-green-500' : 'text-red-500'}`}>
                                                            {probabilityPercent}%
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Status:</span>
                                                        <span className={`font-semibold ${isWatermarked ? 'text-green-500' : 'text-red-500'}`}>
                                                            {isWatermarked ? 'Watermarked' : 'Not Watermarked'}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>

                         {/* Footer Logic - Conditional Rendering */}
                          {/* Case 1: Files selected, no process running, no results yet, no API error shown */}
                        {detectFiles.length > 0 && !isDetecting && detectResults.length === 0 && !detectError &&(
                            <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => resetState('detect')} disabled={isDetecting}>
                                   <RotateCcw className="w-4 h-4 mr-2"/> Reset Selection
                                </Button>
                                <Button onClick={handleDetectFolder} disabled={isDetecting || detectFiles.length === 0}>
                                    <Siren className="mr-2 h-4 w-4" />
                                    Detect Watermark ({detectFiles.length})
                                </Button>
                           </CardFooter>
                        )}

                         {/* Case 2: Process finished (results OR API error shown), not currently processing */}
                        {((detectResults.length > 0 || (detectError && detectFiles.length > 0)) && !isDetecting) && (
                            <CardFooter className="flex justify-end gap-2 pt-4">
                               <Button variant="outline" onClick={() => resetState('detect')}>
                                   <RotateCcw className="w-4 h-4 mr-2"/> Reset & Start Over
                               </Button>
                            </CardFooter>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}