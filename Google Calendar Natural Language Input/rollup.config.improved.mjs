import resolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs';

// Configuration for files that need external dependencies bundled
const bundledConfigs = [
  {
    input: 'src/popup.js',
    output: {
      file: 'chrome-extension/popup.js',
      format: 'iife', // Immediately Invoked Function Expression - works in any environment
    },
    plugins: [
      resolve(),
      commonJS({
        include: ['node_modules/**']
      }),
    ],
  },
  {
    input: 'src/content-helpers.js',
    output: {
      file: 'chrome-extension/content-helpers.js',
      format: 'iife',
      name: 'GoogleCalendarNLP' // Global variable name for content scripts
    },
    plugins: [
      resolve(),
      commonJS({
        include: ['node_modules/**']
      }),
    ],
  }
];

// Configuration for files that don't need external dependencies
const standaloneConfigs = [
  {
    input: 'src/content.js',
    output: {
      file: 'chrome-extension/content.js',
      format: 'iife',
      name: 'GoogleCalendarContent'
    },
    external: [],
    plugins: []
  },
  {
    input: 'src/shared-utils.js',
    output: {
      file: 'chrome-extension/shared-utils.js',
      format: 'iife',
      name: 'SharedUtils'
    },
    external: [], // No external dependencies
    plugins: []
  },
  {
    input: 'src/help-content.js',
    output: {
      file: 'chrome-extension/help-content.js', 
      format: 'iife',
      name: 'HelpContent'
    },
    external: [],
    plugins: []
  }
];

export default [...bundledConfigs, ...standaloneConfigs];
