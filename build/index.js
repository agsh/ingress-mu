"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const port = 13666;
const app = express_1.default();
(async () => {
    const client = await mongodb_1.MongoClient.connect('mongodb://localhost', {
        useUnifiedTopology: true,
    });
    const db = client.db('ingress');
    const mu = await db.createCollection('mu');
    await mu.createIndex({ geo: '2dsphere' });
    await mu.insertOne({
        mu: 0,
        geo: {
            type: 'Point',
            coordinates: [125.6, 10.1],
        },
    });
    // app.post('/mu', (req, res) => {});
    app.listen(port, () => console.log(`Listening on ${port}`));
})().catch((err) => console.error(err));
//# sourceMappingURL=index.js.map