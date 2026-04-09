import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure directory exists
async function ensureDir() {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
}

export async function GET() {
    try {
        await ensureDir();
        const files = await fs.readdir(UPLOAD_DIR);
        
        const mediaFiles = await Promise.all(
            files.map(async (fileName) => {
                const stat = await fs.stat(path.join(UPLOAD_DIR, fileName));
                return {
                    id: fileName,
                    name: fileName,
                    url: `/uploads/${fileName}`,
                    size: stat.size,
                    createdAt: stat.birthtime,
                    type: fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? 'image' : 'document'
                };
            })
        );
        
        mediaFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return NextResponse.json(mediaFiles);
    } catch (error) {
        console.error("Media GET error:", error);
        return NextResponse.json({ error: "Failed to fetch media files" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await ensureDir();
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // Clean filename to prevent weird characters but keep extension
        const rawName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const ext = path.extname(rawName);
        const nameNoExt = path.basename(rawName, ext);
        // Add timestamp to prevent overwriting
        const safeFileName = `${nameNoExt}-${Date.now()}${ext}`;

        await fs.writeFile(path.join(UPLOAD_DIR, safeFileName), buffer);

        return NextResponse.json({ 
            success: true, 
            file: {
                id: safeFileName,
                name: safeFileName,
                url: `/uploads/${safeFileName}`,
                size: buffer.length,
            }
        });
    } catch (error) {
        console.error("Media POST error:", error);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const fileName = url.searchParams.get('file');

        if (!fileName) {
             return NextResponse.json({ error: "No file specified" }, { status: 400 });
        }

        // Prevent directory traversal attacks
        if (fileName.includes('..') || fileName.includes('/')) {
             return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
        }

        const filePath = path.join(UPLOAD_DIR, fileName);
        await fs.unlink(filePath);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Media DELETE error:", error);
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}
