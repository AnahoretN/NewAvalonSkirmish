import ViteExpress from "vite-express";

import {app, server} from "./server.js";

ViteExpress.bind(app, server);
