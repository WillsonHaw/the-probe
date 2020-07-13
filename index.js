require('ts-node').register({
  project: 'tsconfig.json',
});

const { main } = require('./src/index');

main();
