#!/usr/bin/env node
import fs from 'node:fs';import {createRequire} from 'node:module';const require=createRequire(import.meta.url),d=require('../site/lib/d3fend-model.js');
function usage(){console.error('Usage: d3fend-engine.mjs model | catalog FILE.json | resolve FILE.json | defense FILE.json | map-attack FILE.json | alignment FILE.json | compose FILE.json');process.exitCode=2}
function read(file){if(!file)throw new Error('JSON input file required');return JSON.parse(fs.readFileSync(file,'utf8'))}
try{const [cmd,file]=process.argv.slice(2);let out;if(cmd==='model')out=d.model();else if(['catalog','resolve','defense','map-attack','alignment','compose'].includes(cmd))out=d.runAction({action:cmd.replaceAll('-','_'),...read(file)});else{usage();process.exit(2)}console.log(JSON.stringify(out,null,2))}catch(error){console.error(String(error.message||error));process.exit(1)}
