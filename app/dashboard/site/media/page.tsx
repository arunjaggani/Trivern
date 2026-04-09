"use client";

import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, UploadCloud, Trash2, Copy, File, Loader2 } from "lucide-react";

type MediaFile = {
    id: string;
    name: string;
    url: string;
    size: number;
    createdAt: string;
    type: "image" | "document";
};

export default function MediaLibraryPage() {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFiles = async () => {
        try {
            const res = await fetch("/api/media");
            if (res.ok) {
                const data = await res.json();
                setFiles(data);
            }
        } catch (error) {
            console.error("Failed to fetch media:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/media", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                await fetchFiles();
            } else {
                alert("Upload failed.");
            }
        } catch (error) {
            console.error("Upload error", error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async (fileName: string) => {
        if (!confirm("Are you sure you want to delete this file?")) return;
        
        try {
            const res = await fetch(`/api/media?file=${encodeURIComponent(fileName)}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setFiles(files.filter(f => f.name !== fileName));
            } else {
                alert("Delete failed.");
            }
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(window.location.origin + url);
        alert("URL copied to clipboard!");
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ImageIcon className="text-cyan-400" /> Media Library
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Upload and manage your site's assets</p>
                </div>
                
                <div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleUpload} 
                        className="hidden" 
                        accept="image/*,.pdf,.doc,.docx"
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {uploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                        {uploading ? "Uploading..." : "Upload File"}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20 text-cyan-500">
                    <Loader2 size={32} className="animate-spin" />
                </div>
            ) : files.length === 0 ? (
                <div className="border border-dashed border-cyan-500/20 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-white/5">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4">
                        <ImageIcon size={32} />
                    </div>
                    <h3 className="text-white font-semibold mb-1">No media found</h3>
                    <p className="text-gray-400 text-sm max-w-sm mb-6">Upload images or documents to use them across your website and SEO settings.</p>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-cyan-400 text-sm font-semibold hover:underline"
                    >
                        Browse files
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {files.map((file) => (
                        <div key={file.id} className="group relative bg-white/5 border border-cyan-500/10 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all">
                            <div className="aspect-square bg-black/20 flex items-center justify-center overflow-hidden">
                                {file.type === "image" ? (
                                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                ) : (
                                    <File size={40} className="text-gray-500" />
                                )}
                            </div>
                            
                            <div className="p-3">
                                <p className="text-sm text-white font-semibold truncate" title={file.name}>{file.name}</p>
                                <p className="text-xs text-gray-500 mt-1">{formatSize(file.size)}</p>
                            </div>

                            {/* Floating Action Overlay */}
                            <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                <button 
                                    onClick={() => handleCopy(file.url)}
                                    className="p-2 bg-white/10 hover:bg-cyan-500/20 text-white hover:text-cyan-400 rounded-lg transition-colors"
                                    title="Copy URL"
                                >
                                    <Copy size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(file.name)}
                                    className="p-2 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 rounded-lg transition-colors"
                                    title="Delete File"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
