const {model,runAction}=require('../../lib/dml-model');
function body(req){if(req.body&&typeof req.body==='object')return req.body;if(typeof req.body==='string')return JSON.parse(req.body||'{}');return{}}
function send(res,status,payload){res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');return res.status(status).json(payload)}
module.exports=(req,res)=>{try{if(req.method==='GET')return send(res,200,{ok:true,...model(),actions:['model','normalize_detection','assessment','semantic_bridge','compose']});if(req.method!=='POST')return send(res,405,{ok:false,error:'GET or POST required'});return send(res,200,{ok:true,...runAction(body(req))})}catch(error){return send(res,400,{ok:false,error:String(error.message||error)})}};
