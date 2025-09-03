import serverless from "serverless-http";
import { createServer } from "../server/index";

const app = createServer();

export const config = {
  runtime: "nodejs22.x",
};

export default serverless(app);
