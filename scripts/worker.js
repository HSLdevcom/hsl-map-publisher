const { Worker, QueueScheduler } = require('bullmq');
const Redis = require('ioredis');

const { generate } = require('./generator');
const { addEvent, updatePoster } = require('./store');
const { REDIS_CONNECTION_STRING } = require('../constants');

async function processJob(options) {
  const { id } = options;

  const onInfo = (message = 'No message.') => {
    console.log(`${id}: ${message}`); // eslint-disable-line no-console
    addEvent({
      posterId: id,
      type: 'INFO',
      message,
    });
  };
  const onError = error => {
    console.error(`${id}: ${error.message} ${error.stack}`); // eslint-disable-line no-console
    addEvent({
      posterId: id,
      type: 'ERROR',
      message: error.message,
    });
  };

  const { success, uploaded } = await generate({
    ...options,
    onInfo,
    onError,
  });

  updatePoster({
    id,
    status: success && uploaded ? 'READY' : 'FAILED',
  });
}

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
    await processJob(options);
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
