import url from 'node:url';
import process from 'node:process';
import {globSync} from 'glob';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import serve from 'rollup-plugin-serve';
import urlPlugin from '@rollup/plugin-url';
import license from 'rollup-plugin-license';
import del from 'rollup-plugin-delete';
import emitEJS from 'rollup-plugin-emit-ejs';
import {getBabelOutputPlugin} from '@rollup/plugin-babel';
import {getPackagePath, getBuildInfo, generateTLSConfig, getDistPath} from '@dbp-toolkit/dev-utils';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const appEnv = typeof process.env.APP_ENV !== 'undefined' ? process.env.APP_ENV : 'local';
const watch = process.env.ROLLUP_WATCH === 'true';
const buildFull = (!watch && appEnv !== 'test') || process.env.FORCE_FULL !== undefined;
let useTerser = buildFull;
let useBabel = buildFull;
let checkLicenses = buildFull;
let treeshake = buildFull;

// if true, app assets and configs are whitelabel
let whitelabel;
// path to non whitelabel assets and configs
let customAssetsPath;
// development path
let devPath = 'assets_custom/dbp-cabinet/assets/';
// deployment path
let deploymentPath = '../assets/';

let useHTTPS = false;

// set whitelabel bool according to used environment
if (
    (appEnv.length > 6 && appEnv.substring(appEnv.length - 6) == 'Custom') ||
    appEnv == 'production'
) {
    whitelabel = false;
} else {
    whitelabel = true;
}

// load devconfig for local development if present
let devConfig = require('./app.config.json');
try {
    console.log('Loading ' + './' + devPath + 'app.config.json ...');
    devConfig = require('./' + devPath + 'app.config.json');
    customAssetsPath = devPath;
} catch (e) {
    if (e.code == 'MODULE_NOT_FOUND') {
        console.warn('no dev-config found, try deployment config instead ...');

        // load devconfig for deployment if present
        try {
            console.log('Loading ' + './' + deploymentPath + 'app.config.json ...');
            devConfig = require('./' + deploymentPath + 'app.config.json');
            customAssetsPath = deploymentPath;
        } catch (e) {
            if (e.code == 'MODULE_NOT_FOUND') {
                console.warn('no dev-config found, use default whitelabel config instead ...');
                devConfig = require('./app.config.json');
                customAssetsPath = devPath;
            } else {
                throw e;
            }
        }
    } else {
        throw e;
    }
}

let assetsPath = !whitelabel ? customAssetsPath : 'assets';

console.log('APP_ENV: ' + appEnv);

let config;
if (devConfig != undefined && appEnv in devConfig) {
    // choose devConfig if available
    config = devConfig[appEnv];
} else if (appEnv === 'test') {
    config = {
        basePath: '/',
        entryPointURL: 'https://test',
        keyCloakBaseURL: 'https://test',
        keyCloakClientId: '',
        keyCloakRealm: '',
        matomoUrl: '',
        matomoSiteId: -1,
        nextcloudBaseURL: 'https://test',
        nextcloudName: '',
        pdfAsQualifiedlySigningServer: 'https://test',
        hiddenActivities: [],
        enableAnnotations: true,
        typesense: {
            host: 'typesense.localhost',
            port: '9100',
            path: '/',
            protocol: 'http',
            key: 'xyz',
            collection: 'cabinet',
        },
    };
} else {
    console.error(`Unknown build environment: '${appEnv}', use one of '${Object.keys(devConfig)}'`);
    process.exit(1);
}

if (config.nextcloudBaseURL) {
    config.nextcloudFileURL = config.nextcloudBaseURL + '/index.php/apps/files/?dir=';
    config.nextcloudWebAppPasswordURL = config.nextcloudBaseURL + '/index.php/apps/webapppassword';
    config.nextcloudWebDavURL = config.nextcloudBaseURL + '/remote.php/dav/files';
} else {
    config.nextcloudFileURL = '';
    config.nextcloudWebAppPasswordURL = '';
    config.nextcloudWebDavURL = '';
}

if (watch) {
    config.basePath = '/dist/';
}

function getOrigin(url) {
    if (url) return new URL(url).origin;
    return '';
}

// these are the hosts that are allowed to be embedded in an iframe
const atrustHosts = [
    'https://www.handy-signatur.at', // old one
    'https://service.a-trust.at',
];

config.CSP = `default-src 'self' 'unsafe-inline' \
${getOrigin(config.matomoUrl)} ${getOrigin(config.keyCloakBaseURL)} ${getOrigin(
    config.entryPointURL,
)} \
${getOrigin(config.nextcloudBaseURL)} ${atrustHosts.map((h) => getOrigin(h)).join(' ')} \
${config.typesense.protocol + '://' + config.typesense.host + ':' + config.typesense.port} \
${getOrigin(config.pdfAsQualifiedlySigningServer)}; \
img-src * blob: data:`;

let input = ['src/' + pkg.internalName + '.js'];

let activities = {
    'dbp-cabinet-search': [
        'src/dbp-cabinet-search.js',
        'src/objectTypes/fileAdmissionNotice.js',
        'src/objectTypes/fileCommunication.js',
        'src/objectTypes/fileIdentityDocument.js',
        'src/objectTypes/fileMinimalSchema.js',
        'src/objectTypes/fileCitizenshipCertificate.js',
        'src/objectTypes/person.js',
        'src/modules/instantSearch.js',
    ],
    'dbp-create-request': ['vendor/dispatch/src/dbp-create-request.js'],
    'dbp-show-requests': ['vendor/dispatch/src/dbp-show-requests.js'],
    'dbp-qualified-signature-pdf-upload': [
        'vendor/signature/src/dbp-qualified-signature-pdf-upload.js',
    ],
    'dbp-official-signature-pdf-upload': [
        'vendor/signature/src/dbp-official-signature-pdf-upload.js',
    ],
};

let APP_ACTIVITIES = process.env.APP_ACTIVITIES;
const activitiesToInclude =
    APP_ACTIVITIES === undefined
        ? Object.keys(activities)
        : APP_ACTIVITIES
          ? APP_ACTIVITIES.split(',').map((a) => a.trim())
          : [];

for (let activity of activitiesToInclude) {
    if (!(activity in activities)) {
        console.error(`Unknown activity: '${activity}', use one of '${Object.keys(activities)}'`);
        process.exit(1);
    }
}
activities = Object.fromEntries(
    Object.entries(activities).filter(([name]) => activitiesToInclude.includes(name)),
);

input = [...input, ...Object.values(activities).flat()];

if (!whitelabel) {
    input = [...input, await getPackagePath('@tugraz/web-components', 'src/logo.js')];
}

export default (async () => {
    let privatePath = await getDistPath(pkg.name);
    return {
        input: appEnv != 'test' ? input : globSync('test/**/*.js'),
        output: {
            dir: 'dist',
            entryFileNames: '[name].js',
            chunkFileNames: 'shared/[name].[hash].[format].js',
            format: 'esm',
            sourcemap: true,
        },
        treeshake: treeshake,
        onwarn: function (warning, warn) {
            // more eval
            if (warning.code === 'EVAL' && warning.id.includes('pdfAnnotate.js')) {
                return;
            }
            if (warning.code === 'EVAL' && warning.id.includes('pdf.js')) {
                return;
            }
            warn(warning);
        },
        plugins: [
            del({
                targets: 'dist/*',
            }),
            emitEJS({
                src: assetsPath,
                include: ['**/*.ejs', '**/.*.ejs'],
                data: {
                    getUrl: (p) => {
                        return url.resolve(config.basePath, p);
                    },
                    getPrivateUrl: (p) => {
                        return url.resolve(`${config.basePath}${privatePath}/`, p);
                    },
                    isVisible: (name) => {
                        return !config.hiddenActivities.includes(name);
                    },
                    name: pkg.internalName,
                    entryPointURL: config.entryPointURL,
                    nextcloudWebAppPasswordURL: config.nextcloudWebAppPasswordURL,
                    nextcloudWebDavURL: config.nextcloudWebDavURL,
                    nextcloudBaseURL: config.nextcloudBaseURL,
                    nextcloudFileURL: config.nextcloudFileURL,
                    nextcloudName: config.nextcloudName,
                    keyCloakBaseURL: config.keyCloakBaseURL,
                    keyCloakRealm: config.keyCloakRealm,
                    keyCloakClientId: config.keyCloakClientId,
                    CSP: config.CSP,
                    matomoUrl: config.matomoUrl,
                    matomoSiteId: config.matomoSiteId,
                    buildInfo: getBuildInfo(appEnv),
                    shortName: config.shortName,
                    appDomain: config.appDomain,
                    enableAnnotations: config.enableAnnotations,
                    typesenseHost: config.typesense.host,
                    typesensePort: config.typesense.port,
                    typesensePath: config.typesense.path,
                    typesenseProtocol: config.typesense.protocol,
                    typesenseKey: config.typesense.key,
                    typesenseCollection: config.typesense.collection,
                    activities: activities,
                },
            }),
            replace({
                // If you would like DEV messages, specify 'development'
                // Otherwise use 'production'
                'process.env.NODE_ENV': JSON.stringify('production'),
                preventAssignment: true,
            }),
            resolve({
                browser: true,
                preferBuiltins: true,
            }),
            checkLicenses &&
                license({
                    banner: {
                        commentStyle: 'ignored',
                        content: `
License: <%= pkg.license %>
Dependencies:
<% _.forEach(dependencies, function (dependency) { if (dependency.name) { %>
<%= dependency.name %>: <%= dependency.license %><% }}) %>
`,
                    },
                    thirdParty: {
                        allow(dependency) {
                            let licenses = [
                                'MIT',
                                '(MIT OR GPL-3.0-or-later)',
                                'Apache-2.0',
                                '(Apache-2.0)',
                                'MIT OR SEE LICENSE IN FEEL-FREE.md',
                                'LGPL-2.1-or-later',
                                'BSD-3-Clause',
                                'BSD-2-Clause',
                                'BSD',
                                '(MPL-2.0 OR Apache-2.0)',
                                '0BSD',
                            ];
                            if (!licenses.includes(dependency.license)) {
                                throw new Error(
                                    `Unknown license for ${dependency.name}: ${dependency.license}`,
                                );
                            }
                            return true;
                        },
                    },
                }),
            commonjs({
                include: 'node_modules/**',
                strictRequires: 'auto',
            }),
            json(),
            urlPlugin({
                limit: 0,
                include: [
                    await getPackagePath('select2', '**/*.css'),
                    await getPackagePath('tippy.js', '**/*.css'),
                ],
                emitFiles: true,
                fileName: 'shared/[name].[hash][extname]',
            }),
            copy({
                targets: [
                    {
                        src: 'vendor/signature/assets/*-placeholder.png',
                        dest: 'dist/' + (await getDistPath('@digital-blueprint/esign-app')),
                    },
                    {
                        src: 'vendor/dispatch/assets/*-placeholder.png',
                        dest: 'dist/' + (await getDistPath('@digital-blueprint/dispatch-app')),
                    },
                    {src: 'assets/*.css', dest: 'dist/' + (await getDistPath(pkg.name))},
                    {src: 'assets/*.ico', dest: 'dist/' + (await getDistPath(pkg.name))},
                    {
                        src: 'assets/translation_overrides/',
                        dest: 'dist/' + (await getDistPath(pkg.name)),
                    },
                    {src: 'assets/*.metadata.json', dest: 'dist'},
                    {src: 'src/*.metadata.json', dest: 'dist'},
                    {src: 'assets/modules.json', dest: 'dist/' + (await getDistPath(pkg.name))},
                    {src: 'vendor/signature/src/*.metadata.json', dest: 'dist'},
                    {src: 'vendor/dispatch/src/*.metadata.json', dest: 'dist'},
                    {src: 'assets/*.svg', dest: 'dist/' + (await getDistPath(pkg.name))},
                    {src: 'assets/htaccess-shared', dest: 'dist/shared/', rename: '.htaccess'},
                    {src: 'assets/icon-*.png', dest: 'dist/' + (await getDistPath(pkg.name))},
                    {src: 'assets/apple-*.png', dest: 'dist/' + (await getDistPath(pkg.name))},
                    {src: 'assets/safari-*.svg', dest: 'dist/' + (await getDistPath(pkg.name))},
                    {src: 'assets/images/*', dest: 'dist/images'},
                    {src: 'assets/icon/*', dest: 'dist/' + (await getDistPath(pkg.name, 'icon'))},
                    {
                        src: 'assets/site.webmanifest',
                        dest: 'dist',
                        rename: pkg.internalName + '.webmanifest',
                    },
                    {src: 'assets/silent-check-sso.html', dest: 'dist'},
                    {
                        src: await getPackagePath('instantsearch.css', 'themes/algolia-min.css'),
                        dest: 'dist/' + (await getDistPath(pkg.name)),
                    },
                    // the pdfjs worker is needed for signature, dispatch, pdf-viewer and the annotation loading in cabinet!
                    {
                        src: await getPackagePath('pdfjs-dist', 'legacy/build/pdf.worker.mjs'),
                        dest: 'dist/local/@digital-blueprint/esign-app/pdfjs',
                    },
                    {
                        src: await getPackagePath('pdfjs-dist', 'cmaps/*'),
                        dest: 'dist/local/@digital-blueprint/esign-app/pdfjs',
                    }, // do we want all map files?
                    {
                        src: await getPackagePath('pdfjs-dist', 'legacy/build/pdf.worker.mjs'),
                        dest: 'dist/local/@dbp-toolkit/pdf-viewer/pdfjs',
                    },
                    {
                        src: await getPackagePath('pdfjs-dist', 'cmaps/*'),
                        dest: 'dist/local/@dbp-toolkit/pdf-viewer/pdfjs',
                    }, // do we want all map files?
                    {
                        src: await getPackagePath('@fontsource/nunito-sans', '*'),
                        dest: 'dist/' + (await getDistPath(pkg.name, 'fonts/nunito-sans')),
                    },
                    {
                        src: await getPackagePath('@dbp-toolkit/common', 'src/spinner.js'),
                        dest: 'dist/' + (await getDistPath(pkg.name)),
                        rename: 'org_spinner.js',
                    },
                    {
                        src: await getPackagePath('@dbp-toolkit/common', 'src/spinner.js'),
                        dest: 'dist/' + (await getDistPath(pkg.name)),
                    },
                    {
                        src: await getPackagePath('@dbp-toolkit/common', 'misc/browser-check.js'),
                        dest: 'dist/' + (await getDistPath(pkg.name)),
                    },
                    {
                        src: await getPackagePath('@dbp-toolkit/common', 'assets/icons/*.svg'),
                        dest: 'dist/' + (await getDistPath('@dbp-toolkit/common', 'icons')),
                    },
                    {
                        src: await getPackagePath('tabulator-tables', 'dist/css'),
                        dest:
                            'dist/' +
                            (await getDistPath(
                                '@digital-blueprint/dispatch-app',
                                'tabulator-tables',
                            )),
                    },
                    {
                        src: await getPackagePath('tabulator-tables', 'dist/css'),
                        dest:
                            'dist/' +
                            (await getDistPath('@dbp-toolkit/file-handling', 'tabulator-tables')),
                    },
                    {
                        src: await getPackagePath('tabulator-tables', 'dist/css'),
                        dest:
                            'dist/' +
                            (await getDistPath('@dbp-toolkit/tabulator-table', 'tabulator-tables')),
                    },
                ],
            }),
            useBabel &&
                getBabelOutputPlugin({
                    compact: false,
                    presets: [
                        [
                            '@babel/preset-env',
                            {
                                loose: true,
                                shippedProposals: true,
                                bugfixes: true,
                                modules: false,
                                targets: {
                                    esmodules: true,
                                },
                            },
                        ],
                    ],
                }),
            useTerser ? terser() : false,
            watch
                ? serve({
                      contentBase: '.',
                      host: '127.0.0.1',
                      port: 8001,
                      historyApiFallback: config.basePath + pkg.internalName + '.html',
                      https: useHTTPS ? await generateTLSConfig() : false,
                      headers: {
                          'Content-Security-Policy': config.CSP,
                      },
                  })
                : false,
        ],
    };
})();
