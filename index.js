const fs = require('fs');
const http = require('http');
const express = require("express");
const app = express();
const cors = require('cors')
const Gamedig = require('gamedig');
const mcache = require('memory-cache');

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

app.get("/amg/1", cache(120), (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=120');
    Gamedig.query({
        type: "forrest",
        host: "157.90.7.148",
        port: "10015",
    }).then((state) => {
        res.json(state);
    }).catch((error) => {
        res.json(error);
    });
});

app.get("/amg/2", cache(120), (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=120');
    Gamedig.query({
        type: "rust",
        host: "51.77.77.129",
        port: "27030",
    }).then((state) => {
        res.json(state);
    }).catch((error) => {
        res.json(error);
    });
});

app.get('/game/:gamename/:host/:port', cache(120), (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=120');
    Gamedig.query({
        type: req.params.gamename,
        host: req.params.host,
        port: req.params.port,
    }).then((state) => {
        res.json(state);
    }).catch((error) => {
        res.json(error);
    });
});

var httpsServer = http.createServer({}, app);

httpsServer.listen(3035);
