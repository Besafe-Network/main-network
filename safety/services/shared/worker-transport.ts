import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export type WorkerService = 'discord-bot' | 'vrchat-bot';
export type WorkerCommandHandler = (payload: any) => Promise<any> | any;
export type WorkerCommandHandlers = Record<string, WorkerCommandHandler>;
export type WorkerRequestHandler = (service: WorkerService, command: string, payload: any) => Promise<any> | any;

interface WorkerCommandResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class WorkerSocketHub {
  private io?: SocketIOServer;
  private workerRequestHandler?: WorkerRequestHandler;

  setWorkerRequestHandler(handler: WorkerRequestHandler) {
    this.workerRequestHandler = handler;
  }

  attach(server: HttpServer, authToken: string) {
    if (this.io) return;

    const io = new SocketIOServer(server, {
      cors: { origin: false },
      connectTimeout: 20000,
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 50 * 1024 * 1024,
      transports: ['websocket', 'polling'],
    });

    io.use((socket, next) => {
      const { service, token } = socket.handshake.auth || {};
      if (token !== authToken || !authToken) return next(new Error('Unauthorized worker connection'));
      if (service !== 'discord-bot' && service !== 'vrchat-bot') {
        return next(new Error('Unknown worker service'));
      }
      socket.data.workerService = service as WorkerService;
      socket.data.workerMetadata = socket.handshake.auth?.metadata || {};
      next();
    });

    io.on('connection', (socket) => {
      const shardMeta = socket.data.workerMetadata?.shardId;
      const shardSuffix = shardMeta !== undefined ? `, shard #${shardMeta}` : '';
      console.log(`[Worker Socket] ${socket.data.workerService} connected (${socket.id}${shardSuffix})`);
      socket.on('worker:request', async (request: { command: string; payload?: any }, acknowledge: (response: WorkerCommandResponse) => void) => {
        if (!this.workerRequestHandler) {
          acknowledge({ success: false, error: 'Dashboard worker request handler is unavailable' });
          return;
        }
        try {
          const data = await this.workerRequestHandler(socket.data.workerService, request.command, request.payload || {});
          acknowledge({ success: true, data });
        } catch (error: any) {
          acknowledge({ success: false, error: error?.message || 'Dashboard worker request failed' });
        }
      });
      socket.on('disconnect', (reason) => {
        console.log(`[Worker Socket] ${socket.data.workerService} disconnected (${reason}${shardSuffix})`);
      });
    });

    this.io = io;
  }

  connectedCount(service: WorkerService): number {
    return this.getWorkers(service).length;
  }

  private async waitForWorkers(
    service: WorkerService,
    shardId?: number,
    maxWaitMs = 12000
  ): Promise<Socket[]> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const workers = this.getWorkers(service);
      if (workers.length > 0) {
        if (typeof shardId === 'number') {
          const exact = workers.find((candidate) => Number(candidate.data.workerMetadata?.shardId ?? 0) === shardId);
          if (exact) return [exact];
          if (workers.length === 1 && shardId === 0) return [workers[0]];
        } else {
          return workers;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    return [];
  }

  async request(service: WorkerService, command: string, payload: any = {}): Promise<any> {
    let workers = this.getWorkers(service);
    if (workers.length === 0) {
      workers = await this.waitForWorkers(service, undefined, 12000);
    }
    const worker = workers[0];
    if (!worker) throw new Error(`No connected ${service} worker`);
    return this.sendCommand(worker, command, payload);
  }

  async requestShard(service: WorkerService, shardId: number, command: string, payload: any = {}): Promise<any> {
    const findTarget = () => {
      const workers = this.getWorkers(service);
      const exact = workers.find((candidate) => Number(candidate.data.workerMetadata?.shardId ?? 0) === shardId);
      if (exact) return exact;
      if (workers.length === 1 && shardId === 0) return workers[0];
      return undefined;
    };

    let worker = findTarget();
    if (!worker) {
      const waited = await this.waitForWorkers(service, shardId, 12000);
      worker = waited[0];
    }
    if (!worker) throw new Error(`No ${service} worker connected for shard ${shardId}`);
    return this.sendCommand(worker, command, payload);
  }

  async requestAll(service: WorkerService, command: string, payload: any = {}, requireAll = false): Promise<any[]> {
    let workers = this.getWorkers(service);
    if (workers.length === 0) {
      workers = await this.waitForWorkers(service, undefined, 12000);
    }
    if (workers.length === 0) throw new Error(`No connected ${service} workers`);

    const results = await Promise.allSettled(workers.map((worker) => this.sendCommand(worker, command, payload)));
    const responses = results.filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled');
    if (requireAll && responses.length !== workers.length) {
      const failed = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
      throw failed?.reason || new Error(`Not every ${service} worker accepted ${command}`);
    }
    if (responses.length === 0) {
      const failed = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
      throw failed?.reason || new Error(`No ${service} worker accepted ${command}`);
    }
    return responses.map((result) => result.value);
  }

  private getWorkers(service: WorkerService): Socket[] {
    if (!this.io) return [];
    return [...this.io.sockets.sockets.values()].filter(
      (socket) => socket.connected && socket.data.workerService === service
    );
  }

  private sendCommand(socket: Socket, command: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutMs = ['ban-guilds', 'unban-guilds', 'guild-data', 'create-backup', 'restore-backup'].includes(command)
        ? 120000
        : 20000;
      socket.timeout(timeoutMs).emit('worker:command', { command, payload }, (timeoutError: Error | null, response: WorkerCommandResponse) => {
        if (timeoutError) return reject(timeoutError);
        if (!response?.success) return reject(new Error(response?.error || `Worker command failed: ${command}`));
        resolve(response.data);
      });
    });
  }
}

export const workerSocketHub = new WorkerSocketHub();