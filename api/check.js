export default async function handler(req,res){

const domain=(req.query.domain||"").trim().toLowerCase();

if(!domain){
return res.status(200).json({
status:"Offline",
category:"-",
ssl:"-",
score:0,
reputation:"Unknown",
title:"-"
});
}

let status="Offline";
let ssl="-";
let title="-";
let score=0;
let reputation="Unknown";
let category="Website";

try{

try{
const r=await fetch("https://"+domain,{
method:"GET",
redirect:"follow"
});

status="Online";
ssl="Yes";
score=90;

const html=await r.text();

const m=html.match(/<title>(.*?)<\/title>/i);
if(m) title=m[1].slice(0,60);

}catch{

try{
await fetch("http://"+domain);
status="Online";
score=80;
}catch{}

}

if(domain.includes("google")) category="Search Engine";
else if(domain.includes("github")) category="Developer";
else if(domain.includes("facebook")) category="Social Media";
else if(domain.includes("youtube")) category="Streaming";
else if(domain.includes("bank")) category="Finance";
else if(domain.includes("amazon")) category="Ecommerce";

if(score>=90) reputation="Excellent";
else if(score>=75) reputation="Trustworthy";
else if(score>=50) reputation="Neutral";
else if(score>0) reputation="Suspicious";

return res.status(200).json({
domain,
status,
category,
ssl,
score,
reputation,
title
});

}catch(e){

return res.status(200).json({
domain,
status:"Offline",
category:"-",
ssl:"-",
score:0,
reputation:"Unknown",
title:"-"
});

}

}
