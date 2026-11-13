import { io, Socket } from 'socket.io-client';
import { config } from './config';
import { WorkerCommandHandlers, WorkerService } from './worker-transport';

export function connectWorkerToDashboard(
  service: WorkerService,
  handlers: WorkerCommandHandlers,
  metadata: Record<string, string | number> = {}
): Socket {
  const socket = io(config.dashboardSocketUrl, {
    auth: { service, token: config.workerAuthToken, metadata },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => console.log(`[${service}] Connected to dashboard command socket`));
  socket.on('connect_error', (error) => console.error(`[${service}] Dashboard socket connection failed: ${error.message}`));
  socket.on('disconnect', (reason) => {
    console.warn(`[${service}] Dashboard socket disconnected: ${reason}`);
    if (reason === 'io server disconnect' || reason === 'io client disconnect') {
      setTimeout(() => {
        if (!socket.connected) {
          socket.connect();
        }
      }, 1000);
    }
  });
  socket.on('worker:command', async (request: { command: string; payload?: any }, acknowledge: (response: any) => void) => {
    const handler = handlers[request.command];
    if (!handler) {
      acknowledge({ success: false, error: `Unsupported worker command: ${request.command}` });
      return;
    }

    try {
      acknowledge({ success: true, data: await handler(request.payload || {}) });
    } catch (error: any) {
      acknowledge({ success: false, error: error?.message || 'Worker command failed' });
    }
  });

  if (!config.workerAuthToken) {
    console.error(`[${service}] WORKER_AUTH_TOKEN is missing; dashboard will reject this worker connection`);
  }

  return socket;
}

export function requestDashboardCommand(socket: Socket, command: string, payload: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    socket.timeout(30000).emit('worker:request', { command, payload }, (timeoutError: Error | null, response: { success: boolean; data?: any; error?: string }) => {
      if (timeoutError) return reject(timeoutError);
      if (!response?.success) return reject(new Error(response?.error || `Dashboard command failed: ${command}`));
      resolve(response.data);
    });
  });
}