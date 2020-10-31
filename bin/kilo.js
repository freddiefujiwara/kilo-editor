#!/bin/env node

const Kilo = require('../src/kilo');
const k = new Kilo(process.argv.slice(2));
k.main();
