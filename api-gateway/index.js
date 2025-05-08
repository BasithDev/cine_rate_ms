const express = require('express');
const winston = require('winston');
const {expressjwt: jwtMiddleware} = require('express-jwt');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv').config();
const axios = require('axios');
const cors = require('cors');
const uaParser = require('ua-parser-js');
const app = express();

app.use(express.json());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:3003',
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add timestamp
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/server.log' })
  ]
});

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

const JWT_SECRET = process.env.JWT_SECRET;
app.use(jwtMiddleware({ secret: JWT_SECRET, algorithms: ['HS256'] }).unless({ 
  path: [
    '/health',
    /^\/user\/login/,
    /^\/user\/signup/,
    /^\/user\/test/,
    /^\/watchlist\/test/,
    /^\/review\/test/,

  ]
}));


app.use((req, res, next) => {
  const parser = new uaParser(req.headers['user-agent']);
  const { os, browser, device } = parser.getResult();
  const userId = req?.user?.id || "guest";
  const logMessage = `IP: ${req.ip} | User: ${userId} | ${req.method} ${req.originalUrl} | OS: ${os.name || 'Unknown'} ${os.version || 'Unknown'} | Browser: ${browser.name || 'Unknown'} ${browser.version || 'Unknown'} | Device: ${device.vendor || 'Unknown'} ${device.model || 'Unknown'}`;
  logger.info(logMessage);
  next();
});

app.get('/health', (req, res) => {
  res.status(200).send('API Gateway is healthy');
});

const serviceMap = {
  '/user': process.env.USER_SERVICE_URL,
  '/watchlist': process.env.WATCHLIST_SERVICE_URL,
  '/review': process.env.REVIEW_SERVICE_URL
};

app.use(async (req, res, next) => {
    const basePath = Object.keys(serviceMap).find((path) => req.originalUrl.startsWith(path));
    const serviceURL = serviceMap[basePath];
  
    if (!serviceURL) return res.status(404).send('Service not found');
  
    try {
      const url = serviceURL + req.originalUrl.replace(basePath, '')|| '/';
      const response = await axios({
        url,
        method: req.method,
        data: req.body
      });
      res.status(response.status).send(response.data);
    } catch (err) {
      logger.error(err.message);
      console.log(err)
      res.status(err.response?.status || 500).send(err.response?.data || 'Internal Gateway Error');
    }
  });

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
  });
}

module.exports = app;