'use strict';

// Source-text contracts inspect authored names; browser tests load the install file.
const { assembleSource } = require('../scripts/build.cjs');
module.exports.loadSource = () => assembleSource().readable;
