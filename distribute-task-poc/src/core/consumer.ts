
import * as store from './store';
import config from './config';

const chalk = require('chalk');

export async function start() {
    const checkpoint = await store.getCheckpoint(config.region);
    log('Consumer started. Region:', chalk.bgRed(config.region), '. Initial continuation: ', chalk.bgBlue(checkpoint?.continuation));
    await execute(checkpoint?.continuation);
}

async function execute(continuation: string) {    
    try {
        const data = await store.listNotifications(continuation);
        if (!continuation || data.notifications.length > 0) {
            // Process changes
            await Promise.all(data.notifications.map(id => (async () => {
                try {
                    const task = await store.getTaskById(id);
                    if (task && task.audience === config.region) {
                        log('Process task: ', id);
                        task.status = 'complete';
                        task.updatedAt = + new Date();
                        task.updatedBy = config.region;
                        await store.updateTask(task);
                    }
                } catch (e) {
                    log(chalk.bgRed(e.message));
                }
            })()));

            // Memorize checkpoint
            await store.upsertCheckpoint({
                id: config.region, 
                continuation: data.continuation,
                updatedAt: + new Date(),
            });

            continuation = data.continuation;
        }
    } catch (e) {
        log(chalk.bgRed(e.message));
    }

    setTimeout(execute, 500, continuation);
}

function log(message: any, ...args: any[]) {
    console.log(chalk.bgGreen('CONSUMER:'), message, ...args);
}
