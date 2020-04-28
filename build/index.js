"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const mongodb_1 = require("mongodb");
const cors_1 = __importDefault(require("cors"));
const port = process.env.PORT || 5000;
const app = express_1.default();
app.use(body_parser_1.default.json());
app.use(cors_1.default());
app.use(express_1.default.static(__dirname));
(async () => {
    const client = await mongodb_1.MongoClient.connect('mongodb+srv://admin:adminingress@cluster0-jy0ep.mongodb.net/test?retryWrites=true&w=majority', {
        useUnifiedTopology: true,
    });
    const db = client.db('ingress');
    const mu = await db.createCollection('mu');
    await mu.createIndex({ geometry: '2dsphere' });
    await mu.deleteMany({ 'properties.dateTime': null });
    await mu.createIndex({ 'properties.dateTime': 1 }, { unique: true });
    app.post('/mu', async (req, res) => {
        console.log(req.body);
        const feature = req.body;
        try {
            await mu.insertOne({
                ...feature,
                properties: {
                    ...feature.properties,
                    dateTime: new Date(feature.properties.dateTime),
                },
            });
        }
        catch (e) {
            // polygon already exists
            // console.error(e);
            return res.send({ ok: false });
        }
        return res.send({ ok: true });
    });
    app.get('/mu', async (_req, res) => {
        const fields = await mu
            .find({
            geometry: {
                $geoWithin: {
                    $geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [28.157958984375, 59.25464954448365],
                                [32.14599609375, 59.25464954448365],
                                [32.14599609375, 60.71619779357714],
                                [28.157958984375, 60.71619779357714],
                                [28.157958984375, 59.25464954448365],
                            ],
                        ],
                    },
                },
            },
        })
            .toArray();
        res.send({
            type: 'FeatureCollection',
            features: fields,
        });
    });
    app.listen(port, () => console.log(`Listening on ${port}`));
})().catch((err) => console.error(err));
//# sourceMappingURL=index.js.map