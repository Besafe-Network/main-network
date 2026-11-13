import 'dotenv/config';

// Force service name to web-dashboard
process.env.SERVICE_NAME = 'web-dashboard';

// Import and run the dashboard server
import('../../server.js').catch((err) => {
  // If server.js fails (in tsx/ts mode), try server.ts
  import('../../server.ts').catch((tsErr) => {
    console.error('[Web Dashboard Service] Fatal error starting dashboard:', tsErr || err);
    process.exit(1);
  });
});
