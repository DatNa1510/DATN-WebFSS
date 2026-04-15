import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Serve fashion-dataset images from parent directory
    {
      name: 'fashion-images-middleware',
      configureServer(server) {
        server.middlewares.use('/fashion-images', (req, res, next) => {
          const imgPath = path.resolve(
            __dirname,
            '../fashion-dataset/images',
            req.url.replace(/^\//, '')
          );
          if (fs.existsSync(imgPath)) {
            res.setHeader('Content-Type', 'image/jpeg');
            fs.createReadStream(imgPath).pipe(res);
          } else {
            next();
          }
        });
      },
    },
  ],
  server: {
    port: 5173,
    open: true,
  },
})
