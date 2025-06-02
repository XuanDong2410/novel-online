import { createApp, PORT } from "./config/app.config.js";
import { configureRoutes } from "./config/routes.config.js";
import { connectDB } from "./config/db.config.js";
import { initializeSystemUser } from "./config/systemAccount.config.js";
import http from "http";
import { setupWebSocket } from "./config/webSocket.config.js";

async function startServer() {
  const app = createApp();
  configureRoutes(app);
  const server = http.createServer(app);

  // Khởi tạo socket
  setupWebSocket(server);

  connectDB();
  initializeSystemUser();
  
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection: ", err.message);
  process.exit(1);
});

startServer().catch((err) => {
  console.error("Error starting server: ", err.message);
  process.exit(1);
});
