# Fieldhouse image product dataset

The manifest keeps the same 10 users, 2 seller accounts, and their 2 stores. Product records are generated one-to-one from the WebP files in `dataset/img` (currently 30 images across five categories). Seller profiles and existing store ownership are never overwritten; accounts and stores are created only when they are missing.

To rebuild the manifest after adding/removing product images, run from the repository root:

```powershell
node dataset/build-manifest.js
```

To sync the generated records and actual image files to MongoDB and R2, configure `server/.env` and run:

```powershell
node dataset/seed.js
```

The sync adds or updates image-matched products and uploads each source image under `fieldhouse-dataset-v2/products/`. It verifies product counts and R2 object readability. It does not delete the previous v1 sample or any unrelated MongoDB/R2 data.

The 10 image-dataset accounts use the password `DatasetTest123!`; their existing passwords and profiles are preserved. The seed also creates these demo accounts with password `Password123!` (their password is reset to this value on each seed run):

| Role | Email |
| --- | --- |
| Admin | `admin@fieldhouse.local` |
| Seller | `nike@fieldhouse.local` |
| Seller | `adidas@fieldhouse.local` |

These are synthetic test accounts, not real people.

After a successful run, `dataset.json` contains the generated public image URLs. Product records use the `image-product-*` slug prefix and R2 objects use `fieldhouse-dataset-v2/`.
