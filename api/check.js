import axios from "axios";

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

let status="Online";
let category="Website";
let ssl="-";
let score=80;
let reputation="Trustworthy";
let title="-";

try{

try{
const r=await axios.get("https://"+domain,{timeout:5000});
ssl="Yes";

const m=(r.data||"").match(/<title>(.*?)<\/title>/i);
if(m) title=m[1].slice(0,60);

}catch{

try{
await axios.get("http://"+domain,{timeout:5000});
status="Online";
}catch{
status="Offline";
score=0;
reputation="Unknown";
}

}

if(domain.includes("google")) category="Search Engine";
else if(domain.includes("github")) category="Developer";
else if(domain.includes("facebook")) category="Social Media";
else if(domain.includes("youtube")) category="Streaming";
else if(domain.includes("bank")) category="Finance";
else if(domain.includes("amazon")) category="Ecommerce";

if(status==="Offline"){
score=0;
reputation="Unknown";
}
else if(score>=90) reputation="Excellent";
else if(score>=75) reputation="Trustworthy";
else if(score>=50) reputation="Neutral";
else reputation="Suspicious";

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
