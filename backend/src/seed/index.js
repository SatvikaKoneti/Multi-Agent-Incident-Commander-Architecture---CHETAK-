import { initDatabase } from '../db/index.js';
import { openDatabase, run, get } from '../db/engine.js';
import { readCsv, readJson } from '../providers/telemetryDataLoaderProvider.js';
import { initRagIfNeeded } from '../rag/ragKnowledgeBaseInitializer.js';
import { findOrCreateDemoUsers } from '../services/userAuthenticationService.js';

export async function seedDatabase({ force = false, withRag = true } = {}) {
  await initDatabase();

  seedLocalities();
  seedAuthorities();
  const complaints = seedComplaints();
  if (force) {
    // wipe derived entities so re-seeding is clean
    run('DELETE FROM analyses');
    run('DELETE FROM agent_runs');
    run('DELETE FROM agent_results');
    run('DELETE FROM fusion_results');
    run('DELETE FROM recommendations');
    run('DELETE FROM recommendation_options');
    run('DELETE FROM clarification_requests');
    run('DELETE FROM authority_responses');
    run('DELETE FROM implementation_tracking');
    run('DELETE FROM kpis');
    run('DELETE FROM feedback');
    run('DELETE FROM audit_logs');
  }

  const users = await findOrCreateDemoUsers();
  if (withRag) {
    try {
      await initRagIfNeeded();
    } catch (err) {
      // RAG indexing is non-critical on first boot if data files are absent.
      throw err;
    }
  }

  const stats = {
    localities: countRows('localities'),
    complaints: countRows('citizen_complaints'),
    users: users,
    authorities: countRows('authorities'),
    constraints: readCsv('constraints_demo.csv').length,
    scenarios: readJson('scenarios.json').length,
  };
  return stats;
}

export function seedAuthorities() {
  const DEFAULT_CATEGORIES = {
    TSSPDCL: ['Electricity', 'Electrical Infrastructure', 'Street Lights', 'Energy / Power Supply'],
    GHMC: ['Road Damage', 'Potholes', 'Drainage', 'Civic Infrastructure', 'Sanitation', 'Municipal Issues', 'Roads', 'Infrastructure'],
    HTP: ['Traffic Congestion', 'Traffic Signals', 'Junction Problems', 'Road Traffic Management', 'Traffic & Roads', 'Parking'],
    TSPCB: ['Air Pollution', 'Industrial Pollution', 'Water Pollution', 'Noise Pollution', 'Environment'],
    HMWSSB: ['Water Supply', 'Sewerage', 'Drainage / Sewerage'],
    'GHMC-SWM': ['Waste Management', 'Garbage Collection', 'Sanitation'],
    TSRTC: ['Public Transport', 'Bus Operations'],
    HMDA: ['Metropolitan Planning', 'Land Use'],
  };

  const rows = readCsv('authorities_demo.csv');
  for (const r of rows) {
    const code = r.authority_code;
    const cats = JSON.stringify(DEFAULT_CATEGORIES[code] || ['General Civic']);
    run(
      `INSERT INTO authorities
       (code, name, short_name, domain, description, assigned_categories, sla_hours, contact_email, active)
       VALUES ($code, $name, $shortName, $domain, $desc, $cats, $sla, $email, 1)
       ON CONFLICT(code) DO UPDATE SET
         name=$name, domain=$domain, description=$desc, assigned_categories=$cats`,
      {
        $code: code,
        $name: r.name,
        $shortName: code,
        $domain: r.domain,
        $desc: r.responsibility,
        $cats: cats,
        $sla: 48,
        $email: `demo.${code.toLowerCase()}@hytrace.demo`,
      },
    );
  }
}

export function seedLocalities() {
  const rows = readCsv('localities_demo.csv');
  for (const r of rows) {
    run(
      `INSERT INTO localities (id, name, lat, lng, population, area_sqkm, is_demo)
       VALUES ($id, $name, $lat, $lng, $pop, $area, 1)
       ON CONFLICT(id) DO UPDATE SET name=$name, lat=$lat, lng=$lng, population=$pop, area_sqkm=$area`,
      {
        $id: r.locality_id,
        $name: r.name,
        $lat: Number(r.lat),
        $lng: Number(r.lng),
        $pop: Number(r.population),
        $area: Number(r.area_sqkm),
      },
    );
  }
}

export function seedComplaints() {
  const rows = readCsv('citizen_complaints_demo.csv');
  let inserted = 0;
  for (const r of rows) {
    const existing = get('SELECT id FROM citizen_complaints WHERE tracking_id = ?', [r.tracking_id]);
    if (existing) continue;
    const locality = get('SELECT id FROM localities WHERE name = ?', [r.locality]);
    run(
      `INSERT INTO citizen_complaints
       (tracking_id, title, description, category, locality_id, area, lat, lng, severity_input, image_path, status, created_at)
       VALUES ($tracking, $title, $description, $category, $locality, $area, $lat, $lng, $severity, $image, $status, $created)`,
      {
        $tracking: r.tracking_id,
        $title: r.title,
        $description: r.description,
        $category: r.category,
        $locality: locality ? locality.id : null,
        $area: r.area || null,
        $lat: r.lat ? Number(r.lat) : null,
        $lng: r.lng ? Number(r.lng) : null,
        $severity: Number(r.severity_input),
        $image: null,
        $status: r.status,
        $created: `${r.submitted_date} 09:00:00`,
      },
    );
    inserted += 1;
  }
  return inserted;
}

function countRows(table) {
  const row = get(`SELECT COUNT(*) AS n FROM ${table}`);
  return row.n;
}

export async function runSeedCli() {
  const { config } = await import('../config.js');
  console.log(`Seeding database at ${config.db.path} ...`);
  const stats = await seedDatabase({ force: false });
  console.log('Seed complete:', stats);
}

if (process.argv[1] && process.argv[1].endsWith('seed/index.js')) {
  await runSeedCli();
}