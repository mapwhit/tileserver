import { cpus } from 'node:os';

process.env.UV_THREADPOOL_SIZE = Math.ceil(Math.max(4, cpus().length * 1.5));
