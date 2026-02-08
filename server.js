import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable Gzip compression
app.use(compression());

// Enable CORS for development
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey', 'x-customer-id', 'x-request-id']
}));

// CSP and Security headers
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://o4510671251177472.ingest.us.sentry.io https://cdn.jsdelivr.net blob:; " +
        "worker-src 'self' blob:; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
        "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net; " +
        "img-src 'self' data: https: blob:; " +
        "media-src 'self' data:; " +
        "frame-src 'self' https://*.supabase.co; " +
        "connect-src 'self' https://*.supabase.co https://*.googleapis.com https://*.firebaseio.com https://o4510671251177472.ingest.us.sentry.io wss://*.supabase.co;"
    );
    next();
});

// Log all requests for debugging (only in production to diagnose issues)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
    maxAge: '1y',
    etag: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// SPA fallback - improved asset detection
app.get('*', (req, res) => {
    const ext = path.extname(req.path);

    // If it's an asset request (has extension like .js, .css, .png, etc.)
    // but NOT .html (which should serve index.html for SPA routing)
    if (ext && ext !== '.html') {
        console.log(`[404] Asset not found: ${req.path}`);
        return res.status(404).send('Asset not found');
    }

    // For all other routes (no extension or .html), serve index.html (SPA routing)
    console.log(`[SPA] Serving index.html for: ${req.path}`);
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 10000;

// Supabase Proxy Middleware
// This allows the server to act as a VPN/Proxy for the frontend
import { createProxyMiddleware } from 'http-proxy-middleware';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kbgbftyvbdgyoeosxlok.supabase.co';

app.use('/supabase-proxy', createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    ws: true, // Enable WebSocket proxying
    pathRewrite: {
        '^/supabase-proxy': '', // Remove /supabase-proxy base path
    },
    onProxyReq: (proxyReq, req, res) => {
        // Ensure Host header matches the target
        // proxyReq.setHeader('Host', new URL(SUPABASE_URL).host);
    },
    onProxyReqWs: (proxyReq, req, socket, options, head) => {
        // Handle WebSocket handshake if needed
        // console.log('WebSocket proxy connection attempt');
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).send('Proxy Error');
    }
}));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Supabase Proxy Active at /supabase-proxy`);
});
