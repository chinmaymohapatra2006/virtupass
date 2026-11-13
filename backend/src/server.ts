import { buildApp } from './app';
import { env } from './utils/env';

async function startServer() {
  try {
    const app = await buildApp();

    const address = await app.listen({
      port: env.PORT,
      host: env.HOST
    });

    console.log(`=======================================================`);
    console.log(`  VirtuPass Backend Service Running!`);
    console.log(`  Environment : ${env.NODE_ENV}`);
    console.log(`  Listening at: ${address}`);
    console.log(`  Health Check: ${address}/api/v1/health`);
    console.log(`  System Info : ${address}/api/v1/system/info`);
    console.log(`  Data Engine : In-Memory Store (Resets on restart)`);
    console.log(`=======================================================`);

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        console.log(`\nReceived ${signal}. Gracefully terminating VirtuPass backend...`);
        await app.close();
        process.exit(0);
      });
    }
  } catch (error) {
    console.error('Fatal error starting VirtuPass backend server:', error);
    process.exit(1);
  }
}

startServer();
