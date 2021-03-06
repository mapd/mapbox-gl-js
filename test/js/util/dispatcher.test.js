'use strict';

const test = require('mapbox-gl-js-test').test;
const proxyquire = require('proxyquire');
const Dispatcher = require('../../../js/util/dispatcher');
const WebWorker = require('../../../js/util/web_worker');

test('Dispatcher', (t) => {
    t.test('requests and releases workers from pool', (t) => {
        const workers = [new WebWorker(), new WebWorker()];

        const releaseCalled = [];
        const workerPool = {
            acquire: function () {
                return workers;
            },
            release: function (id) {
                releaseCalled.push(id);
            }
        };

        const dispatcher = new Dispatcher(workerPool, {});
        t.same(dispatcher.actors.map((actor) => { return actor.target; }), workers);
        dispatcher.remove();
        t.equal(dispatcher.actors.length, 0, 'actors discarded');
        t.same(releaseCalled, [dispatcher.id]);

        t.end();
    });

    t.test('creates Actors with unique map id', (t) => {
        const Dispatcher = proxyquire('../../../js/util/dispatcher', {'./actor': Actor });
        const WorkerPool = proxyquire('../../../js/util/worker_pool', {
            '../mapbox-gl': { workerCount: 1 }
        });

        const ids = [];
        function Actor (target, parent, mapId) { ids.push(mapId); }

        const workerPool = new WorkerPool();
        const dispatchers = [new Dispatcher(workerPool, {}), new Dispatcher(workerPool, {})];
        t.same(ids, dispatchers.map((d) => { return d.id; }));

        t.end();
    });

    t.test('#remove destroys actors', (t) => {
        const Dispatcher = proxyquire('../../../js/util/dispatcher', {'./actor': Actor });
        const actorsRemoved = [];
        function Actor() {
            this.remove = function() { actorsRemoved.push(this); };
        }
        const WorkerPool = proxyquire('../../../js/util/worker_pool', {
            '../mapbox-gl': { workerCount: 4 }
        });

        const workerPool = new WorkerPool();
        const dispatcher = new Dispatcher(workerPool, {});
        dispatcher.remove();
        t.equal(actorsRemoved.length, 4);
        t.end();
    });

    t.end();
});

