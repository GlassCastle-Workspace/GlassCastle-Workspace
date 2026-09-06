#!/usr/bin/env node
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const diamond=require('../site/lib/diamond-model.js');
function usage(){console.error('Usage: diamond-engine.mjs model | event FILE.json | pivot FILE.json | contextualize FILE.json | thread FILE.json | group FILE.json | group-family FILE.json | activity-attack FILE.json');process.exitCode=2}
function read(file){if(!file)throw new Error('JSON input file required.');return JSON.parse(file==='-'?fs.readFileSync(0,'utf8'):fs.readFileSync(file,'utf8'))}
const [cmd,file]=process.argv.slice(2);
try{
  let out;if(cmd==='model')out=diamond.model();
  else if(['event','pivot','contextualize','thread','group','group-family','activity-attack'].includes(cmd))out=diamond.runAction({action:cmd.replaceAll('-','_'),...read(file)});
  else {usage();process.exit(2)}
  console.log(JSON.stringify(out,null,2));
}catch(error){console.error(JSON.stringify({ok:false,error:error.message},null,2));process.exitCode=1}
