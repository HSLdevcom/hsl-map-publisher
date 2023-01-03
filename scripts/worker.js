const { Worker, QueueScheduler } = require('bullmq');
const Redis = require('ioredis');

const { generate } = require('./generator');

const { REDIS_CONNECTION_STRING } = require('../constants');

const bullRedisConnection = new Redis(REDIS_CONNECTION_STRING, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Queue scheduler to restart stopped jobs.
const queueScheduler = new QueueScheduler('publisher', {
  connection: bullRedisConnection,
});

// Worker implementation
const worker = new Worker(
  'publisher',
  async job => {
    const { options } = job.data;
    await generate(options);
  },
  {
    connection: bullRedisConnection,
  },
);

console.log('Worker ready for jobs!');

worker.on('active', job => {
  console.log(`Started to process ${job.id}`);
});

worker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`${job.id} has failed with ${err.message}`);
});

worker.on('drained', () => console.log('Job queue empty! Waiting for new jobs...'));

process.on('SIGINT', () => {
  console.log('Shutting down worker...');
  worker.close(true);
  queueScheduler.close();
  process.exit(0);
});
