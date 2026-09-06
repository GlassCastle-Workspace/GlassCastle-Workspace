#!/usr/bin/env node
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ukc=require('../site/lib/ukc-model.js');
function usage(){console.error('Usage: ukc-engine.mjs model | analyze-path FILE.json | coverage FILE.json | compare-paths FILE.json');process.exitCode=2}
function read(file){if(!file)throw new Error('JSON input file required.');return JSON.parse(file==='-'?fs.readFileSync(0,'utf8'):fs.readFileSync(file,'utf8'))}
const [cmd,file]=process.argv.slice(2);
try{
  let out;
  if(cmd==='model')out=ukc.model();
  else if(cmd==='analyze-path')out=ukc.analyzePath(read(file));
  else if(cmd==='coverage')out=ukc.coverage(read(file));
  else if(cmd==='compare-paths')out=ukc.comparePaths(read(file));
  else {usage();process.exit(2)}
  console.log(JSON.stringify(out,null,2));
}catch(error){console.error(JSON.stringify({ok:false,error:error.message},null,2));process.exitCode=1}
