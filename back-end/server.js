import express from 'express';
import bodyParser from 'body-parser';
import authRouters from './routes/auth.route.js';
import novelRouters from './routes/novel/novel.route.js';
import chapterRouters from './routes/novel/chapter.route.js';
import validRouters from './routes/valid.route.js';
import { ENV_VARS } from './config/envVars.js';
import { connectDB } from './config/db.js';


const app = express(); 
const PORT = ENV_VARS.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/api/V1/auth', authRouters);
app.use('/api/V1/novel', novelRouters);
app.use('/api/V1/chapter', chapterRouters);
app.use('/api/V1/valid', validRouters);

app.listen((PORT), () => {
    console.log('Server is running on port 5000');
    connectDB();
})