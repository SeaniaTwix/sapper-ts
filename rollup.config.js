import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import url from '@rollup/plugin-url'
import json from '@rollup/plugin-json'

import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import typescript2 from 'rollup-plugin-typescript2';
import includePaths from 'rollup-plugin-includepaths'

import {typescript, scss, postcss} from 'svelte-preprocess'
import packageImporter from 'node-sass-package-importer'

import config from 'sapper/config/rollup.js';
import pkg from './package.json';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const legacy = !!process.env.SAPPER_LEGACY_BUILD;

const extensions = ['.js', '.mjs', '.ts', '.html', '.json', '.svelte'];
const includePathsOptions = {
  include: {},
  paths: ['src'],
  external: ['AppModule'],
  extensions,//: ['.js', '.json', '.html']
}

const preprocessOptions = {
  typescript: {
    transpileOnly: true,
    tsconfigFile: './tsconfig.json'
  },
  scss: true,
}

// eslint-disable-next-line no-shadow
const onwarn = (warning, onwarn) => {
  if (warning.message === 'Unused CSS selector') return
  const isCircularDeps = warning.code === 'CIRCULAR_DEPENDENCY'
  return (isCircularDeps && /[/\\]@sapper[/\\]/.test(warning.message)) || onwarn(warning);
}

const clientPlugins = {
  replace: replace({
    'process.browser': true,
    'process.env.NODE_ENV': JSON.stringify(mode),
  }),
  url: url(),
  json: json(),
  svelte: svelte({
    dev,
    hydratable: true,
    emitCss: true,
    preprocess: [
      typescript(preprocessOptions.typescript),
      scss({
        includePaths: ['src'],
        importer: packageImporter(),
        // outputStyle: 'compressed'
      }),
      postcss({
        plugins: [
          require('autoprefixer')({}),
        ],
      }),
    ]
  }),
  resolve: resolve({
    browser: true,
    extensions,
  }),
  commonjs: commonjs(),
  typescript: typescript2(),
  includePaths: includePaths(includePathsOptions),
  babel: babel({
    extensions,
    babelHelpers: 'runtime',
    exclude: ['node_modules/@babel/**'],
    presets: [
      [
        '@babel/preset-env',
        {
          targets: '> 0.25%, not dead',
        },
      ],
    ],
    plugins: [
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-proposal-do-expressions',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-object-rest-spread',
      [
        '@babel/plugin-transform-runtime',
        {
          useESModules: true,
        },
      ],
    ],
  }),
  terser: terser({
    module: true,
  })
}

const serverPlugins = {
  replace: replace({
    'process.browser': false,
    'process.env.NODE_ENV': JSON.stringify(mode),
  }),
  url: url(),
  json: json(),
  svelte: svelte({
      generate: 'ssr',
      dev,
      preprocess: [
        typescript(preprocessOptions.typescript),

        scss({
          includePaths: ['src'],
          importer: packageImporter(),
          // outputStyle: 'compressed'
        }),
        postcss({
          plugins: [
            require('autoprefixer')({}),
          ],
        }),
      ]
    }),
  resolve: resolve(),
  commonjs: commonjs(),
  typescript: typescript2(),
  includePaths: includePaths(includePathsOptions),
  babel: babel({
    extensions,
    babelHelpers: 'runtime',
    exclude: ['node_modules/@babel/**'],
    presets: [
      [
        '@babel/preset-env',
        {
          targets: { node: 'current' },
        },
      ],
    ],
    plugins: [
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-proposal-do-expressions',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-object-rest-spread',
      [
        '@babel/plugin-transform-runtime',
        {
          useESModules: true,
        },
      ],
    ],
  }),
}

export default {
  client: {
    input: config.client.input(),
    output: config.client.output(),
    plugins: [
      clientPlugins.replace,
      clientPlugins.url,
      clientPlugins.json,
      clientPlugins.svelte,
      clientPlugins.resolve,
      clientPlugins.commonjs,
      clientPlugins.typescript,
      clientPlugins.includePaths,
      // legacy &&
      clientPlugins.babel,

      !dev && clientPlugins.terser,
    ],

    onwarn,
  },

  server: {
    input: config.server.input(),
    output: config.server.output(),
    plugins: [
      serverPlugins.replace,
      serverPlugins.url,
      serverPlugins.json,
      serverPlugins.svelte,
      serverPlugins.resolve,
      serverPlugins.commonjs,
      serverPlugins.typescript,
      serverPlugins.includePaths,
      serverPlugins.babel,
    ],
    external: Object.keys(pkg.dependencies).concat(
      require('module').builtinModules || Object.keys(process.binding('natives')),
    ),

    onwarn,
  },

  serviceworker: {
    input: config.serviceworker.input(),
    output: config.serviceworker.output(),
    plugins: [
      resolve(),
      replace({
        'process.browser': true,
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      commonjs(),
      !dev && terser(),
    ],

    onwarn,
  },
};
