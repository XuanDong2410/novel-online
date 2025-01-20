import express from 'express';

import authRouters from './routes/auth.route.js';
import novelRouters from './routes/novel/novel.route.js';
import { ENV_VARS } from './config/envVars.js';
import { connectDB } from './config/db.js';


const app = express(); 
const PORT = ENV_VARS.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/V1/auth', authRouters);
app.use('/api/V1/novel', novelRouters);

app.listen((PORT), () => {
    console.log('Server is running on port 5000');
    connectDB();
})