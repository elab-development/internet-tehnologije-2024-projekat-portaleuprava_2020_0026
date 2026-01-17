<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class FileUploadController extends Controller
{
    public function filebin(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:25600', // 25MB.
        ]);

        $file = $request->file('file');

        $base = rtrim(config('services.filebin.base_url', env('FILEBIN_BASE_URL', 'https://filebin.net')), '/');
        $bin  = config('services.filebin.bin', env('FILEBIN_BIN', 'portal-euprava'));

        // Napravi bezbedan naziv fajla.
        $original = $file->getClientOriginalName();
        $ext = $file->getClientOriginalExtension();
        $safeName = Str::slug(pathinfo($original, PATHINFO_FILENAME)) ?: 'fajl';
        $filename = $safeName . '-' . now()->format('YmdHis') . '-' . Str::random(6) . ($ext ? ".{$ext}" : '');

        // Upload endpoint: POST /{bin}/{filename}.
        $url = "{$base}/{$bin}/{$filename}";

        try {
            $response = Http::withHeaders([
                'Content-Type' => $file->getMimeType() ?: 'application/octet-stream',
            ])->withBody(
                file_get_contents($file->getRealPath()),
                $file->getMimeType() ?: 'application/octet-stream'
            )->post($url);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Greška pri povezivanju sa Filebin servisom.',
                'error' => $e->getMessage(),
            ], 500);
        }

        if (! $response->successful()) {
            return response()->json([
                'message' => 'Upload na Filebin nije uspeo.',
                'status' => $response->status(),
                'body' => $response->body(),
            ], 422);
        }

        // Link koji čuvaš u bazi.
        $link = $url;

        return response()->json([
            'link' => $link,
            'bin' => $bin,
            'filename' => $filename,
            'name' => $original,
            'size' => $file->getSize(),
            'mimeType' => $file->getMimeType(),
        ]);
    }
}
