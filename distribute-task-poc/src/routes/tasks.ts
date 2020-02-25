import * as _ from 'underscore';
import nanoid from 'nanoid';
import * as express from 'express'

import { Task, TypeStrings } from '../core/types';
import * as store from '../core/store';
import config from '../core/config';

import { wrap } from './utils';

const router = express.Router();

/** CREATE NEW TASK
 *  {
 *    name: 'task name',  
 *  }
 */
router.put('/', wrap(async (req, res) => {
    const { id, name, audience } = req.body;
    const ts = + new Date();
    const doc: Task = {
        id: id || nanoid(10),
        name: name || ts.toString(),
        audience: audience || config.region,
        status: 'new',
        createdBy: config.region,
        createdAt: ts,
    };

    const data = await store.createTask(doc);
    res.status(201).json(data);
}));

router.patch('/:taskId', wrap(async (req, res) => {
    const { status } = req.body;
    const ts = + new Date();
    const task = await store.getTaskById(req.params.taskId);
    if (!task) {
        res.status(404).end();
        return;
    }

    const updated: Task = Object.assign({...task}, {
        status,
        updatedBy: config.region,
        updatedAt: ts
    }) as Task;

    const data = await store.updateTask(updated);
    res.status(201).json(data);
}));

router.get('/:taskId', wrap(async (req, res) => {
    const data = await store.getTaskById(req.params.taskId);
    if (!data) {
        res.status(404).end();
    } else {
        res.status(200).json(data);
    }
}));

export default router;