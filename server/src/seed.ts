import { query } from './db.js'

async function main() {
  // Ensure extension + schema
  await query("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
  const fs = await import('fs/promises')
  const sql = await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf-8')
  await query(sql)

  // Seed companies
  await query(`INSERT INTO companies (name, domain) VALUES 
    ('Google','google.com'),('Microsoft','microsoft.com'),('Amazon','amazon.com'),('Meta','meta.com')
  ON CONFLICT DO NOTHING` as any)

  // Seed areas
  await query(`INSERT INTO areas (name, city, state, lat, lng) VALUES 
    ('SoMa','San Francisco','CA',37.7785,-122.4056),
    ('Capitol Hill','Seattle','WA',47.6231,-122.3165),
    ('Back Bay','Boston','MA',42.3503,-71.0810),
    ('Brooklyn Heights','New York','NY',40.6950,-73.9955)
  ON CONFLICT DO NOTHING` as any)

  // Seed one user
  const u = await query<{ id: string }>(
    `INSERT INTO users (name, age, gender, employer, passcode)
     VALUES ('Demo User', 23, '','Google','demo') RETURNING id`
  )
  const userId = u.rows[0].id

  // Seed a few listings
  await query(
    `INSERT INTO listings (title, city, area_id, price, bedrooms, bathrooms, available_from, image_url, sqft, furnished, pets_allowed, description, owner_user_id)
     VALUES
     ('1BR near SoMa', 'San Francisco', 1, 3200, 1, 1, CURRENT_DATE + INTERVAL '10 days', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688', 560, true, true, 'Cozy and bright 1BR walk-up.', $1),
     ('2BR in Capitol Hill', 'Seattle', 2, 2400, 2, 1, CURRENT_DATE + INTERVAL '20 days', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2', 820, false, true, 'Close to transit and cafes.', $1),
     ('Studio Back Bay', 'Boston', 3, 2100, 0, 1, CURRENT_DATE + INTERVAL '5 days', 'https://images.unsplash.com/photo-1598928506311-9db8dfff2a5b', 480, false, false, 'Great location for students.', $1)` ,
    [userId]
  )

  console.log('Seed complete')
}

main().catch((e) => { console.error(e); process.exit(1) })

