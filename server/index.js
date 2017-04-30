'use strict';

const https = require('https');
const co = require('co');
const koa = require('koa');
const kcors = require('kcors');
const koaMount = require('koa-mount');
const koaStatic = require('koa-static');
const bodyParser = require('koa-bodyparser');
const fetch = require('./fetch.js');
const io = require('./io.js');
const router = require('./router.js');
const pem = require('pem');

const port = process.env.PORT || process.env.LEANCLOUD_APP_PORT || 8080;
const jsoneditor = koa();
const app = koa();

co(function*() {
    jsoneditor.use(koaStatic('./node_modules/jsoneditor.webapp'));

    app.proxy = true;

    app.use(fetch);
    app.use(kcors({
        credentials: true
    }));
    app.use(bodyParser());
    app.use(koaMount('/dist/jsoneditor.webapp', jsoneditor));
    app.use(router.routes());

    pem.createCertificate({days:1, selfSigned:true}, function(err, keys){
        const server = https.createServer({key: keys.serviceKey, cert: keys.certificate}, app.callback());
        app.io = io(server);
        server.listen(port, '0.0.0.0'); // IPv4 model
    })

    console.log(`running at port ${port}...`);
}).catch((e) => {
    console.log(e.stack);
    process.exit(1);
});
