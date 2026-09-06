#!/usr/bin/env node
import fs from 'node:fs';import {createRequire} from 'node:module';const require=createRequire(import.meta.url),dml=require('../site/lib/dml-model.js');
function usage(){console.error('Usage: dml-engine.mjs model | detection FILE.json | assessment FILE.json | bridge FILE.json | compose FILE.json');process.exitCode=2}
function read(file){if(!file)throw new Error('JSON input file required');return JSON.parse(fs.readFileSync(file,'utf8'))}
try{const [cmd,file]=process.argv.slice(2);let out;if(cmd==='model')out=dml.model();else if(['detection','assessment','bridge','compose'].includes(cmd))out=dml.runAction({action:cmd==='bridge'?'semantic_bridge':cmd,...read(file)});else{usage();process.exit(2)}console.log(JSON.stringify(out,null,2))}catch(e){console.error(String(e.message||e));process.exit(1)}
