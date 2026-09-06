#!/usr/bin/env node
import fs from 'node:fs';import {createRequire} from 'node:module';const require=createRequire(import.meta.url),attack=require('../site/lib/attack-model.js');
function usage(){console.error('Usage: attack-engine.mjs model | catalog FILE.json | resolve FILE.json | behavior FILE.json | coverage FILE.json | compose FILE.json');process.exitCode=2}
function read(file){if(!file)throw new Error('JSON input file required');return JSON.parse(fs.readFileSync(file,'utf8'))}
try{const [cmd,file]=process.argv.slice(2);let out;if(cmd==='model')out=attack.model();else if(['catalog','resolve','behavior','coverage','compose'].includes(cmd))out=attack.runAction({action:cmd==='behavior'?'normalize_behavior':cmd,...read(file)});else{usage();process.exit(2)}console.log(JSON.stringify(out,null,2))}catch(error){console.error(String(error.message||error));process.exit(1)}
