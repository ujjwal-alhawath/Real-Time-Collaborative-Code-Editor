import { Queue, Worker, Job } from 'bullmq';
import { getRedis } from '../config/redis';
import { logger } from '../utils/logger';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { isDevelopment } from '../config/env';
import { getIO } from '../socket';

const execPromise = util.promisify(exec);

export interface ExecutionData {
  roomId: string;
  code: string;
  language: string;
}

// Queue for scheduling execution jobs
const executionQueueName = 'code-execution';
let executionQueue: Queue;
let executionWorker: Worker;

export const initExecutionQueue = () => {
  const connection = getRedis();

  executionQueue = new Queue(executionQueueName, { connection });

  executionWorker = new Worker(
    executionQueueName,
    async (job: Job<ExecutionData>) => {
      const { roomId, code, language } = job.data;
      logger.info(`Executing code for room ${roomId} (Lang: ${language})`);

      try {
        let output = '';

        // If local dev without Docker, fallback to safe-ish Node eval for JS
        if (isDevelopment && language === 'javascript') {
          try {
            // Write to a temporary file
            const tmpDir = os.tmpdir();
            const filePath = path.join(tmpDir, `exec-${job.id}.js`);
            await fs.writeFile(filePath, code);

            // Execute it with timeout
            const { stdout, stderr } = await execPromise(`node ${filePath}`, { timeout: 5000 });
            output = stdout || stderr;
            
            // Clean up
            await fs.unlink(filePath).catch(() => {});
          } catch (e: any) {
            output = e.stdout || e.stderr || e.message;
          }
        } else {
          // Production Docker execution strategy
          // For simplicity, we just simulate the docker command for non-JS languages in dev
          if (isDevelopment) {
             output = `(Docker mock) Execution finished for ${language}.\nCode length: ${code.length}`;
             await new Promise(r => setTimeout(r, 1000));
          } else {
             // Real docker command
             const image = language === 'python' ? 'python:3.9-slim' 
                         : language === 'javascript' ? 'node:18-alpine'
                         : 'ubuntu:latest'; // fallback

             const cmd = language === 'python' ? `python -c "${code.replace(/"/g, '\\"')}"`
                       : language === 'javascript' ? `node -e "${code.replace(/"/g, '\\"')}"`
                       : `echo 'Language not fully configured'`;

             const dockerCmd = `docker run --rm --network none --memory 128m --cpus 0.5 ${image} ${cmd}`;
             
             try {
                const { stdout, stderr } = await execPromise(dockerCmd, { timeout: 10000 });
                output = stdout || stderr;
             } catch (e: any) {
                output = e.stdout || e.stderr || e.message;
             }
          }
        }

        // Notify room of output via socket
        const io = getIO();
        io.to(roomId).emit('execution-result', { status: 'success', output });

      } catch (error: any) {
        logger.error({ error }, 'Code execution failed');
        const io = getIO();
        io.to(roomId).emit('execution-result', { status: 'error', output: error.message });
      }
    },
    { connection, concurrency: 5 }
  );

  executionWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Execution job failed');
  });
};

export const enqueueExecution = async (data: ExecutionData) => {
  if (!executionQueue) throw new Error('Queue not initialized');
  await executionQueue.add('execute-code', data);
};
