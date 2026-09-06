const FABRIC={
  contract:'glasscastles.fabric.registry.v1',
  suite:{name:'ShatteredCastle(s)',contract:'shatteredcastles.suite.v1',company:'GlassCastle(s)',attack_model:{name:'Unified Kill Chain',version:'Pols-2017-final',endpoint:'/api/v1/ukc',contract:'shatteredcastles.ukc.model.v1'},analysis_models:{sequence:{name:'Unified Kill Chain',version:'Pols-2017-final',endpoint:'/api/v1/ukc',contract:'shatteredcastles.ukc.model.v1'},relationship:{name:'Diamond Model of Intrusion Analysis',version:'Caltagirone-Pendergast-Betz-2013',endpoint:'/api/v1/diamond',contract:'shatteredcastles.diamond.model.v1'},cost:{name:'Pyramid of Pain',version:'Bianco-2014-revised',endpoint:'/api/v1/pyramid',contract:'shatteredcastles.pyramid.model.v1'},behavior:{name:'MITRE ATT&CK',version:'v19.2',endpoint:'/api/v1/attack',contract:'shatteredcastles.attack.model.v1'},defense:{name:'MITRE D3FEND',version:'1.6.0',endpoint:'/api/v1/d3fend',contract:'shatteredcastles.d3fend.model.v1'}}},
  workflow:['scope','discover','assess','validate','impact','remediate'],
  stages:[
    {stage:'scope',name:'ScopeSentinel',base_url:'https://scopesentinel-saas.vercel.app',capabilities:'/api/v1/capabilities',agent:'/api/v1/agent',openapi:'/openapi.json'},
    {stage:'discover',name:'Kork',base_url:'https://kork-saas.vercel.app',capabilities:'/api/v1/capabilities',agent:'/api/v1/agent',openapi:'/openapi.json',network:{enrich:'/api/enrich'}},
    {stage:'assess',name:'ShatterAssay',base_url:'https://glasscastle-launchguard.vercel.app',capabilities:'/api/v1/capabilities',agent:'/api/v1/agent',openapi:'/openapi.json',network:{assess:'/api/scan'}},
    {stage:'validate',name:'GlassWitness',base_url:'https://glasswitness-saas.vercel.app',capabilities:'/api/v1/capabilities',agent:'/api/v1/agent',openapi:'/openapi.json'},
    {stage:'impact',name:'BlastRadial',base_url:'https://blastradial-saas.vercel.app',capabilities:'/api/v1/capabilities',agent:'/api/v1/agent',openapi:'/openapi.json'},
    {stage:'remediate',name:'Investigation Console',base_url:'https://glasscastle-investigation-console.vercel.app',capabilities:'/api/v1/capabilities',agent:'/api/v1/agent',openapi:'/openapi.json',network:{capture_source:'/api/research'}}
  ],
  auth:{public_pure_actions:true,optional_bearer_for_agent_network_actions:true,bounded_network_routes:true}
};
module.exports=(req,res)=>{res.setHeader('Cache-Control','public, max-age=60');if(req.method!=='GET')return res.status(405).json({error:'GET required'});return res.status(200).json(FABRIC);};
