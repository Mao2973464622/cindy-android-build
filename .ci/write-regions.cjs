// CI 辅助：生成 apps/mobile/scripts/self-host-regions.json（上游 .gitignore 排除，构建必需）
// 只写占位值：身份/包名沿用内置默认，TapDB/Google 用假 ID（统计 no-op，不影响功能）。
const fs = require('node:fs');
const path = require('node:path');

const keystore = process.env.KEYSTORE_PATH || '/tmp/ci.keystore';
const clientId = '000000000000-ciplaceholder.apps.googleusercontent.com';
const iosClientId = '000000000000-ciplaceholderios.apps.googleusercontent.com';

const signing = { keyAlias: 'cindy-ci', keystorePath: keystore };
const emptyIos = {
  teamId: '',
  profileName: '',
  signIdentity: '',
  profilePath: '',
  exportMethod: '',
};

const config = {
  cn: {
    authRegion: 'cn',
    iosBundleId: 'com.xd.cindycn',
    iosAppStoreId: '',
    androidPackage: 'com.xd.cindycn',
    androidStoreUrl: '',
    npkgExpectBundle: '',
    tapdb: { clientId: 'ci-placeholder', clientToken: 'ci-placeholder' },
    oss: { cdnBaseUrl: '', bucket: '', prefix: '', ossRegion: '' },
    iosSigning: emptyIos,
    androidSigning: signing,
  },
  global: {
    authRegion: 'global',
    iosBundleId: 'com.xd.cindy',
    iosAppStoreId: '',
    androidPackage: 'com.xd.cindy',
    androidStoreUrl: '',
    npkgExpectBundle: '',
    google: {
      webClientId: clientId,
      iosClientId,
      iosUrlScheme: `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`,
    },
    tapdb: { clientId: 'ci-placeholder', clientToken: 'ci-placeholder' },
    oss: { cdnBaseUrl: '', bucket: '', prefix: '', ossRegion: '' },
    iosSigning: emptyIos,
    androidSigning: signing,
  },
  dev: {
    authRegion: 'dev',
    iosBundleId: '',
    iosAppStoreId: '',
    androidPackage: '',
    androidStoreUrl: '',
    npkgExpectBundle: '',
    tapdb: { clientId: '', clientToken: '' },
    oss: { cdnBaseUrl: 'https://example.invalid/cindy', bucket: '', prefix: '', ossRegion: '' },
    iosSigning: emptyIos,
    androidSigning: signing,
  },
};

const out = path.join(__dirname, '..', 'apps', 'mobile', 'scripts', 'self-host-regions.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(config, null, 2)}\n`);
console.log(`wrote ${out} (region=${process.env.BUILD_REGION}, keystore=${keystore})`);
if (!fs.existsSync(keystore)) console.warn(`::warning::keystore 不存在: ${keystore}`);
