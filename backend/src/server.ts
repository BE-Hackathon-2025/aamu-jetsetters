import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import publicRoutes from './routes/public.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { waterDataService } from './services/water-data.service.js';
import { notificationMonitorService } from './services/notification-monitor.service.js';
import { operatorDataService } from './services/operator-data.service.js';
import { ErrorHandler } from './middleware/error-handler.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5175',
  'http://localhost:5173',
  'https://jetsetters-frontend.onrender.com',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'jetsetters-backend',
  });
});

app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use(ErrorHandler.handle);

const updateInterval = parseInt(process.env.DATA_UPDATE_INTERVAL_MS || '60000', 10);
waterDataService.startDataGeneration(updateInterval);
operatorDataService.startDataGeneration(updateInterval);

const enableDemoChecks = !!process.env.TRIGGER_CRITICAL_DELAY;
notificationMonitorService.startMonitoring(updateInterval, enableDemoChecks);

let mlServiceProcess: ReturnType<typeof spawn> | null = null;

const startMLService = () => {
  const mlServicePort = process.env.ML_SERVICE_PORT || '5000';
  process.env.ML_SERVICE_PORT = mlServicePort;
  
  const mlServicePath = path.join(__dirname, '..', 'src', 'services', 'ml-inference-service.py');
  
  mlServiceProcess = spawn('python3', [mlServicePath], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
  
  mlServiceProcess.on('error', (error) => {
    console.error('Failed to start ML inference service:', error);
    console.log('ML service will not be available. Using fallback predictions.');
  });
  
  mlServiceProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`ML inference service exited with code ${code}`);
      console.log('Attempting to restart ML service in 5 seconds...');
      setTimeout(startMLService, 5000);
    }
  });
  
  console.log(`ML inference service starting on port ${mlServicePort}...`);
};

if (process.env.START_ML_SERVICE !== 'false') {
  startMLService();
}

process.on('SIGTERM', () => {
  if (mlServiceProcess) {
    mlServiceProcess.kill();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  if (mlServiceProcess) {
    mlServiceProcess.kill();
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Public API: http://localhost:${PORT}/api/public`);
  console.log(`Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  if (process.env.TRIGGER_CRITICAL_DELAY) {
    const delaySeconds = parseInt(process.env.TRIGGER_CRITICAL_DELAY) || 20;
    
    setTimeout(() => {
      waterDataService.forceCriticalState();
    }, delaySeconds * 1000);
    
    setTimeout(() => {
      waterDataService.forceStableState();
    }, delaySeconds * 1000 + 15000);
    
    setTimeout(() => {
      waterDataService.forceCriticalState();
      
      setTimeout(() => {
        waterDataService.forceStableState();
      }, 15000);
    }, delaySeconds * 1000 + 40000);
    
    const checkNotificationCount = setInterval(() => {
      const count = notificationMonitorService.getNotificationCount();
      
      if (count >= 3) {
        clearInterval(checkNotificationCount);
        waterDataService.stopDataGeneration();
        
        setTimeout(() => {
          waterDataService.startDataGeneration(updateInterval);
        }, 1800000);
      }
    }, 5000);
  }
});

process.on('SIGTERM', () => {
  waterDataService.stopDataGeneration();
  notificationMonitorService.stopMonitoring();
  process.exit(0);
});

process.on('SIGINT', () => {
  waterDataService.stopDataGeneration();
  notificationMonitorService.stopMonitoring();
  process.exit(0);
});

