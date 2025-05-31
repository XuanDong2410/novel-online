
import { createApp, PORT } from './config/app.config.js';
import { configureRoutes } from './config/routes.config.js';
import { connectDB } from './config/db.config.js';
import { initializeSystemUser } from './config/systemAccount.config.js';


async function startServer() {
    const app = createApp()
    configureRoutes(app);
    connectDB();
    initializeSystemUser();
    app.listen((PORT), () => {
        console.log(`Server is running on port ${PORT}`);
    })
}

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection: ', err.message);
    process.exit(1);
});

startServer().catch((err) => {
    console.error('Error starting server: ', err.message);
    process.exit(1);
});