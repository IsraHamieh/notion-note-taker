import express from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import http from 'http';

const router = express.Router();

router.post('/', authenticateJWT, (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  console.log('[@process.ts] /api/process called');
  console.log('[@process.ts] Headers:', req.headers);

  // Proxy the raw request to the Python backend
  const proxyReq = http.request(
    {
      hostname: 'python-backend', // Docker Compose service name
      port: 5001,
      path: '/api/process',
      method: 'POST',
      headers: req.headers,
    },
    (proxyRes) => {
      console.log('[@process.ts] Proxy response status:', proxyRes.statusCode);
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  req.pipe(proxyReq, { end: true });

  proxyReq.on('error', (err) => {
    console.error('[@process.ts] Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  });
});

export default router; 