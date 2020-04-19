import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
// eslint-disable-next-line import/no-unresolved
import { GeoJSON } from 'geojson';
import cors from 'cors';

const port = 13666;
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname));

(async (): Promise<void> => {
  const client = await MongoClient.connect('mongodb://localhost', {
    useUnifiedTopology: true,
  });
  const db = client.db('ingress');
  const mu = await db.createCollection<{
    type: string;
    properties: object;
    geometry: GeoJSON;
  }>('mu');
  await mu.createIndex({ geometry: '2dsphere' }, { unique: true });

  app.post('/mu', async (req, res) => {
    console.log(req.body);
    try {
      await mu.insertOne(req.body);
    } catch (e) {
      // polygon already exists
      return res.send({ ok: false });
    }
    return res.send({ ok: true });
  });
  app.get('/mu', async (_req, res) => {
    const fields = await mu.find({}).toArray();
    res.send({
      type: 'FeatureCollection',
      features: fields,
    });
  });
  app.listen(port, () => console.log(`Listening on ${port}`));
})().catch((err) => console.error(err));
