const {model,analyzePath,coverage,comparePaths}=require('../../lib/ukc-model');
function body(req){if(req.body&&typeof req.body==='object')return req.body;if(typeof req.body==='string')return JSON.parse(req.body||'{}');return{}}
function send(res,status,payload){res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control',status===200?'no-store':'no-store');return res.status(status).json(payload)}
module.exports=(req,res)=>{
  try{
    if(req.method==='GET')return send(res,200,{ok:true,...model(),actions:['model','analyze_path','coverage','compare_paths']});
    if(req.method!=='POST')return send(res,405,{ok:false,error:'GET or POST required'});
    const b=body(req),action=String(b.action||'model').toLowerCase();
    if(action==='model')return send(res,200,{ok:true,...model()});
    if(action==='analyze_path')return send(res,200,{ok:true,...analyzePath(b.input||b.path||b)});
    if(action==='coverage')return send(res,200,{ok:true,...coverage(b.input||b)});
    if(action==='compare_paths')return send(res,200,{ok:true,...comparePaths(b.input||b)});
    return send(res,400,{ok:false,error:`Unknown UKC action: ${action}`});
  }catch(error){return send(res,400,{ok:false,error:String(error.message||error)})}
};
