#!/usr/bin/env node
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),pyramid=require('../site/lib/pyramid-model.js');
function usage(){console.error('Usage: pyramid-engine.mjs model | indicator FILE.json | portfolio FILE.json | ukc-plan FILE.json | diamond-overlay FILE.json');process.exitCode=2}
function read(file){if(!file)throw new Error('JSON input file required');return JSON.parse(fs.readFileSync(file,'utf8'))}
try{const [cmd,file]=process.argv.slice(2);let out;if(cmd==='model')out=pyramid.model();else if(['indicator','portfolio','ukc-plan','diamond-overlay'].includes(cmd))out=pyramid.runAction({action:cmd.replaceAll('-','_'),...read(file)});else{usage();process.exit(2)}console.log(JSON.stringify(out,null,2))}catch(error){console.error(String(error.message||error));process.exit(1)}
