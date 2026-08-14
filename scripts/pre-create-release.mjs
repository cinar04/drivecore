// scripts/pre-create-release.mjs
//
// electron-builder --publish always çalıştırılmadan ÖNCE bu script çalışır.
//
// SORUN: differentialPackage: true olduğunda electron-builder, NSIS installer'ı
// ve .blockmap dosyasını iki AYRI GitHubPublisher örneğiyle yayınlıyor. İkisi de
// build başlarken eş zamanlı olarak "bu tag'e ait release var mı?" diye GitHub'a
// soruyor. Release henüz oluşturulmamışsa, ikisi de "yok" görüp KENDİ draft'ını
// oluşturuyor — installer bir draft'a, blockmap başka bir draft'a düşüyor.
// (electron-builder'ın bilinen bir race condition'ı: GH issue #2393, #6676)
//
// ÇÖZÜM: electron-builder'ı çalıştırmadan önce draft release'i biz oluşturuyoruz.
// Böylece iki publisher da build başladığında "release zaten var" görüyor ve
// ikisi de AYNI release'e yazıyor — ayrı draft oluşturma ihtiyacı kalmıyor.
//
// Gerekli ortam değişkeni:
//   GH_TOKEN  -> electron-builder'ın zaten kullandığı GitHub token'ının aynısı

import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const { owner, repo } = pkg.build?.publish ?? {};
const version = pkg.version;

const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
// electron-builder varsayılan olarak tag adının başına "v" ekler (vPrefixedTagName: true).
const TAG_NAME = process.env.TAG_NAME || `v${version}`;

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
  'User-Agent': 'drivecore-pre-create-release-script',
};

async function main() {
  const existingRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(TAG_NAME)}`,
    { headers }
  );

  if (existingRes.status === 200) {
    console.log(`"${TAG_NAME}" için release zaten mevcut, yeniden oluşturulmadı.`);
    return;
  }
  if (existingRes.status !== 404) {
    const body = await existingRes.text();
    throw new Error(`Release kontrolü başarısız (${existingRes.status}): ${body}`);
  }

  const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tag_name: TAG_NAME,
      name: TAG_NAME,
      draft: true,
      prerelease: TAG_NAME.includes('-beta'),
      generate_release_notes: false,
    }),
  });

  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(`Draft release oluşturulamadı (${createRes.status}): ${body}`);
  }

  console.log(`"${TAG_NAME}" için boş draft release önceden oluşturuldu — electron-builder artık bunu bulup kullanacak.`);
}

main().catch((err) => {
  console.error('pre-create-release.mjs hata:', err);
  process.exit(1);
});
