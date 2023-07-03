const express = require('express');
const session = require('express-session');
const redis = require('redis');
const connectRedis = require('connect-redis');

const app = express();
const RedisStore = connectRedis(session);
const redisClient = redis.createClient({
    url: 'redis://redis:6379'
});

var cors = require('cors')
var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}

// Connect Redis client
redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

// Handle Redis client connection errors
redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

// Session middleware with RedisStore
app.use(
    session({
        store: new RedisStore({ client: redisClient }),
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: true,
    })
);
redisClient.connect();

app.get('/sse', cors(corsOptions), (req, res) => {
console.log(req.headers['x-forwarded-for'] || req.socket.remoteAddress );
     redisClient.sAdd(`uniqueUsers-${req.query.slug}`, [req.headers['x-forwarded-for'] || req.socket.remoteAddress ]);
    redisClient.incr(`onlineUsers-${req.query.slug}`);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const intervalId = setInterval(async () => {
        const timestamp = new Date().toLocaleTimeString();
        const count = await redisClient.get(`onlineUsers:${req.query.slug}`);
        res.write(`data: online: ${count}\n\n`);
        const unique = await redisClient.sCard(`uniqueUsers:${req.query.slug}`);
        res.write(`data: unique: ${unique}\n\n`);
    }, 1000);

    req.on('close', async () => {
        
        redisClient.decr(`onlineUsers-${req.query.slug}`);
        let count = parseInt((await redisClient.get(`onlineUsers:${req.query.slug}`)) || "0");
        if (count <= 0) {
            count = 0;
            clearInterval(intervalId);
        }
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});
