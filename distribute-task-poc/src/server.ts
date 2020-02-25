import * as http from 'http';
import * as _ from 'underscore';
import express from 'express';
import morgan from 'morgan';
import sourceMapSupport from 'source-map-support';

import TasksRoute from './routes/tasks';

import * as consumer from './core/consumer';

sourceMapSupport.install();

const app = express();
app.use(express.json());
app.use(morgan('tiny'));

app.use('/api/tasks', TasksRoute);

app.get('/', (req, res) => {
    res.status(200).end();
});

app.use('/', (err, req, res, next) => {
    const body = _.pick(err, 'name', 'message', 'stack');
    res.status(err.status || 500).json(body);
});

const server = http.createServer(app);
const port = process.env.PORT || 3000;
server.listen(port);
console.debug('Server listening on port ' + port);

consumer.start();