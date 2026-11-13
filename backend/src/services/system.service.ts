import { HealthStatus, SystemInfo } from '../types';
import { env } from '../utils/env';

export class SystemService {
  private startTime = Date.now();

  public getHealth(): HealthStatus {
    const memory = process.memoryUsage();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      service: 'virtupass-backend',
      version: '1.0.0',
      memoryUsage: {
        heapUsedMB: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMB: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        rssMB: Math.round((memory.rss / 1024 / 1024) * 100) / 100
      }
    };
  }

  public getSystemInfo(): SystemInfo {
    return {
      application: 'VirtuPass',
      version: '1.0.0',
      environment: env.NODE_ENV,
      tagline: 'One Identity. One Verified Pass. One Seamless Entry.',
      portals: ['user', 'admin', 'organizer'],
      architecture: 'Fastify REST API + In-Memory Structured Stores (No Database)',
      timestamp: new Date().toISOString()
    };
  }
}

export const systemService = new SystemService();
