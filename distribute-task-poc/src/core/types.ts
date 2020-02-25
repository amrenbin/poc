export type DocumentType = 'task' | 'notification' | 'checkpoint';

export namespace TypeStrings {
    export const Task: DocumentType = 'task';
    export const Notification: DocumentType = 'notification';
    export const Checkpoint: DocumentType = 'checkpoint';
}

export interface Task {
    id: string;
    name: string;
    audience: string;
    status: string;
    createdBy: string;
    createdAt: number;
    updatedBy?: string;
    updatedAt?: number;
}

export interface Notification {
    id: string;
}

// Checkpoint at region level
export interface Checkpoint {
    // one file per region, so region name is the id
    id: string;
    continuation: string;
    updatedAt: number;
}

export interface TaskDoc extends Task {
    _type: 'task';
}

export interface NotificationDoc extends Notification {
    _type: 'notification';
}

export interface CheckpointDoc extends Checkpoint {
    _type: 'checkpoint';
}