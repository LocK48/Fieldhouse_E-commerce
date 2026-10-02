# Fieldhouse connectivity dataset

Run from the repository root after filling in `server/.env`:

```powershell
node dataset/seed.js
```

The script upserts 10 synthetic users, 2 demo stores, 4 categories, and 50 products in MongoDB. It uploads the provided `mercurial.webp` sample as 50 distinct objects under the `fieldhouse-dataset-v1/products/` prefix in R2, attaches each public URL to its product, then verifies MongoDB counts and R2 object readability. Re-running updates only records and objects with this dataset's dedicated names and prefix; it does not clear other data.

All dataset accounts use the password `DatasetTest123!`. The first two accounts are sellers; the other eight are customers. These are synthetic test accounts, not real people.

After a successful run, `dataset.json` contains the dataset manifest and generated public image URLs. To remove the test data later, delete the `dataset.userNN@fieldhouse.test` accounts, the `northstar-athletics` and `stride-supply` stores, products with slugs beginning `dataset-product-`, and R2 objects under `fieldhouse-dataset-v1/`.
