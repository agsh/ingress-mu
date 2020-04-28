import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
// eslint-disable-next-line import/no-unresolved
import { Feature, GeoJSON } from 'geojson';
import cors from 'cors';

const port = 13666;
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname));

(async (): Promise<void> => {
  const client = await MongoClient.connect(
    'mongodb+srv://admin:adminingress@cluster0-jy0ep.mongodb.net/test?retryWrites=true&w=majority',
    {
      useUnifiedTopology: true,
    },
  );
  const db = client.db('ingress');
  const mu = await db.createCollection<{
    type: string;
    properties: object;
    geometry: GeoJSON;
    dateTime: Date;
  }>('mu');
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
          dateTime: new Date(feature.properties!.dateTime),
        },
      });
    } catch (e) {
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
