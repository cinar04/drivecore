// scripts/merge-duplicate-drafts.mjs
//
// electron-builder --publish always ÇALIŞTIKTAN SONRA bu script çalışır.
// pre-create-release.mjs sayesinde artık normalde tetiklenmemesi gerekiyor,
// ama bir güvenlik ağı olarak kalsın: aynı tag adına sahip birden fazla draft
// release varsa (ör. biri sadece .blockmap içeriyorsa), hepsini asset'leri en
// çok olan release'de birleştirir ve boş kalanları siler.
//
// Gerekli ortam değişkeni:
//   GH_TOKEN  -> electron-builder'ın zaten kullandığı GitHub token'ının aynısı

import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const { owner, repo } = pkg.build?.publish ?? {};

const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

if (!GH_TOKEN) {
  console.error('GH_TOKEN (veya GITHUB_TOKEN) tanımlı değil. İşlem durduruldu.');
  process.exit(1);
}
if (!owner || !repo) {
  console.error('package.json > build.publish içinde owner/repo bulunamadı.');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${GH_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'drivecore-merge-duplicate-drafts-script',
};

async function ghJson(url, options) {
  const res = await fetch(url, { ...options, headers: { ...headers, ...(options?.headers || {}) } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API hatası (${res.status}) ${url}: ${body}`);
  }
  return res.status === 204 ? null : res.json();
}

async function listAllReleases() {
  const releases = [];
  let page = 1;
  for (;;) {
    const batch = await ghJson(
      `https://api.github.com/repos/${owner}/${repo}/releases?per_page=100&page=${page}`
    );
    releases.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return releases;
}

async function downloadAsset(asset) {
  const res = await fetch(asset.url, {
    headers: { ...headers, Accept: 'application/octet-stream' },
  });
  if (!res.ok) throw new Error(`Asset indirilemedi (${res.status}): ${asset.name}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadAsset(primaryRelease, asset, data) {
  const uploadUrl = primaryRelease.upload_url.replace('{?name,label}', '') + `?name=${encodeURIComponent(asset.name)}`;
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': asset.content_type || 'application/octet-stream',
    },
    body: data,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Asset yüklenemedi (${res.status}) ${asset.name}: ${body}`);
  }
}

async function main() {
  const releases = await listAllReleases();
  const byTag = new Map();
  for (const r of releases) {
    if (!r.draft) continue; // sadece draft'lar arasında mükerrer arıyoruz
    const list = byTag.get(r.tag_name) || [];
    list.push(r);
    byTag.set(r.tag_name, list);
  }

  let mergedGroups = 0;
  let movedAssets = 0;
  let deletedReleases = 0;

  for (const [tag, group] of byTag) {
    if (group.length < 2) continue;
    mergedGroups++;

    // Birincil (kalacak) release: en çok asset'i olan, eşitlikte en eski.
    const [primary, ...duplicates] = [...group].sort((a, b) => {
      if (b.assets.length !== a.assets.length) return b.assets.length - a.assets.length;
      return new Date(a.created_at) - new Date(b.created_at);
    });

    console.log(`"${tag}" için ${group.length} draft bulundu. Birincil: #${primary.id} (${primary.assets.length} asset).`);

    const primaryAssetNames = new Set(primary.assets.map((a) => a.name));

    for (const dup of duplicates) {
      for (const asset of dup.assets) {
        if (primaryAssetNames.has(asset.name)) {
          console.log(`  · ${asset.name} zaten birincilde var, atlanıyor.`);
          continue;
        }
        console.log(`  · ${asset.name} taşınıyor (#${dup.id} -> #${primary.id})...`);
        const data = await downloadAsset(asset);
        await uploadAsset(primary, asset, data);
        primaryAssetNames.add(asset.name);
        movedAssets++;
      }

      await ghJson(`https://api.github.com/repos/${owner}/${repo}/releases/${dup.id}`, { method: 'DELETE' });
      console.log(`  · Boşalan duplicate draft #${dup.id} silindi.`);
      deletedReleases++;
    }
  }

  if (mergedGroups === 0) {
    console.log('Mükerrer draft bulunamadı — her şey zaten temiz.');
  } else {
    console.log(`${mergedGroups} tag grubu birleştirildi, ${movedAssets} asset taşındı, ${deletedReleases} boş draft silindi.`);
  }
}

main().catch((err) => {
  console.error('merge-duplicate-drafts.mjs hata:', err);
  process.exit(1);
});
