const fs = require('fs');
const http = require('http');
const express = require("express");
const swaggerjsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const cors = require('cors')
const { GameDig } = require('gamedig');
const mcache = require('memory-cache');
const port = process.env.PORT || 3035;

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'GameDig API',
            description: 'GameDig API, used within widgets.gametools.network and the gamedig status bot available on GitHub.',
            contact: {
                name: 'Zefanja Jobse'
            },
        },
        servers: [
            {
                url: "https://gamedig.gametools.network", description: "Main production environment"
            },
            {
                url: "http://localhost:3035", description: "Development environment"
            }
        ],
    },
    apis: ['./index.js']
}

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token');
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});

const cache = (duration) => {
    return (req, res, next) => {
        let key = '__express__' + req.originalUrl || req.url
        let cachedBody = mcache.get(key)
        if (cachedBody) {
            res.send(cachedBody)
            return
        } else {
            res.sendResponse = res.send
            res.send = (body) => {
                mcache.put(key, body, duration * 1000);
                res.sendResponse(body)
            }
            next()
        }
    }
}

/**
 * @openapi
 * /game/{gamename}/{host}/{port}:
 *   get:
 *     summary: Get game data from GameDig.
 *     description: Get game data from GameDig.
 *     parameters:
 *       - in: path
 *         name: gamename
 *         schema:
 *           type: string
 *         required: true
 *         description: the name of the game from gamedig, for example hll. all games are available on https://github.com/gamedig/node-gamedig/blob/master/GAMES_LIST.md
 *       - in: path
 *         name: host
 *         schema:
 *           type: string
 *         required: true
 *         description: Ip address of the server you want to request data of
 *       - in: path
 *         name: port
 *         schema:
 *           type: integer
 *         required: true
 *         description: Port of the server you want to request data of
 *     responses:
 *       '200':
 *         description: A successful response
 *       '500':
 *         description: Internal server error
 */
app.get('/game/:gamename/:host/:port', cache(120), (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=120');
    GameDig.query({
        type: req.params.gamename,
        host: req.params.host,
        port: req.params.port,
    }).then((state) => {
        res.json(state);
    }).catch((error) => {
        res.json(error);
    });
});


/**
 * @openapi
 * /health_check:
 *   get:
 *     summary: Healthcheck to check if this service is running
 *     description: Healthcheck to check if this service is running
 *     responses:
 *       '200':
 *         description: A successful response
 *       '500':
 *         description: Internal server error
 */
app.get('/health_check', cache(120), (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=120');
    res.json({ "status": "ok" });
});

const swaggerDocs = swaggerjsdoc(swaggerOptions)
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

var httpsServer = http.createServer({}, app);

const server = httpsServer.listen(port, () => console.log(`App listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;