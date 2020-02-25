import * as _ from 'underscore';
import nanoid from 'nanoid'
;
import { CosmosClient, ConnectionPolicy } from '@azure/cosmos';

import config from './config';
import { Task, Notification, Checkpoint, TypeStrings, TaskDoc, NotificationDoc, CheckpointDoc } from './types';

const { endpoint, key, database, collection } = config.cosmos;
const connectionPolicy: ConnectionPolicy = {
    enableEndpointDiscovery: true,
    preferredLocations: [config.region],
};

const cosmos = new CosmosClient({ endpoint, key, connectionPolicy });

const container = cosmos.database(database).container(collection);

// TASKS
export async function createTask(task: Task) {
    // Create task, then send notification
    const doc: TaskDoc = {
        ...task,
        _type: 'task',
    };
    const res = await container.items.create<TaskDoc>(doc);
    await container.items.create<NotificationDoc>({
        id: task.id,
        _type: 'notification',
    });
    

    return sanitize<Task>(res.resource);
}

export async function updateTask(task: Task) {
    // Update task, then send notification
    const doc: TaskDoc = {
        ...task,
        _type: 'task',
    };
    const res = await container.item(task.id, TypeStrings.Task).replace<TaskDoc>(doc);    
    return sanitize<Task>(res.resource);
}

export async function getTaskById(id: string) {
    const res = await container.item(id, TypeStrings.Task).read<TaskDoc>();
    if (res.statusCode === 404) {
        return null;
    } else {
        return sanitize<Task>(res.resource);
    }
}

export async function listTasks() {
    const iterator = container.items.query<TaskDoc>(`SELECT * FROM c WHERE c._type = '${TypeStrings.Task}'`);
    const res = await iterator.fetchAll();
    return res.resources.map(o => sanitize<Task>(o));
}

// NOTIFICATIONS
export async function listNotifications(continuation?: string): Promise<{ continuation: string; notifications: string[]; }> {
    const options = !!continuation ? {
        continuation,
    } : {
        startTime: new Date(), // Start from now
    }

    const res = container.items.changeFeed<{ id: string }>(TypeStrings.Notification, options);
    const notifications = [];
    let nextContinuation;
    while(res.hasMoreResults) {
        const page = await res.fetchNext();
        if (page && page.result) {
            notifications.push(...page.result.map(o => o.id));
        }
        nextContinuation = page.continuation;
    }

    return {
        continuation: nextContinuation,
        notifications,
    };
}

// CHECKPOINTS
export async function upsertCheckpoint(checkpoint: Checkpoint) {
    const doc: CheckpointDoc = { ...checkpoint, _type: 'checkpoint' };
    const res = await container.items.upsert<CheckpointDoc>(doc)
    return sanitize<Checkpoint>(res.resource);
}

export async function getCheckpoint(region: string) {
    const res = await container.item(region, TypeStrings.Checkpoint).read<CheckpointDoc>();
    if (res.statusCode === 404) return null;
    return sanitize<Checkpoint>(res.resource);
}

function sanitize<T = any>(data: any) {
    return _.pick(data, Object.keys(data).filter(key => !key.startsWith('_'))) as T;
}