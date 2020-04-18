import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
// eslint-disable-next-line import/no-unresolved
import { GeoJSON } from 'geojson';

const port = 13666;
const app = express();

(async (): Promise<void> => {
  const client = await MongoClient.connect('mongodb://localhost', {
    useUnifiedTopology: true,
  });
  const db = client.db('ingress');
  const mu = await db.createCollection<{ mu: number; geo: GeoJSON }>('mu');
  await mu.createIndex({ geo: '2dsphere' });
  // await mu.insertOne({
  //   mu: 0,
  //   geo: {
  //     type: 'Point',
  //     coordinates: [125.6, 10.1],
  //   },
  // });

  app.post('/mu', async (req, res) => {
    await mu.insertOne(req.body);
    res.end();
  });
  app.listen(port, () => console.log(`Listening on ${port}`));
})().catch((err) => console.error(err));
