import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb } from 'https://esm.sh/pdf-lib@1.17.1';
import fontkit from 'https://esm.sh/@pdf-lib/fontkit@1.1.1';
import QRCode from 'npm:qrcode@1.5.4';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const safe=(v:unknown)=>String(v??'').replace(/[<>&]/g,'');
async function bytes(url:string){const r=await fetch(url);if(!r.ok)throw new Error(`Asset load failed (${r.status})`);return new Uint8Array(await r.arrayBuffer());}
async function embedImage(pdf:any,url:string){const b=await bytes(url);try{return await pdf.embedPng(b)}catch{return await pdf.embedJpg(b)}}

Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 try{
  const supabaseUrl=Deno.env.get('SUPABASE_URL'),serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),anon=Deno.env.get('SUPABASE_ANON_KEY')||'',resend=Deno.env.get('RESEND_API_KEY'),from=Deno.env.get('RESEND_FROM_EMAIL');
  if(!supabaseUrl||!serviceKey||!resend||!from)throw new Error('Required secrets are missing.');
  const auth=req.headers.get('Authorization')||'';const userDb=createClient(supabaseUrl,anon,{global:{headers:{Authorization:auth}}});const {data:{user}}=await userDb.auth.getUser();if(!user)return json({ok:false,error:'Unauthorized'},401);
  const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}});const {action,id}=await req.json();if(action!=='accept'||!id)throw new Error('Invalid action.');
  const {data:r,error}=await admin.from('ticket_requests').select('*,matches(*)').eq('id',id).single();if(error||!r)throw error||new Error('Ticket request not found.');
  const accepted=await admin.from('ticket_requests').select('*',{count:'exact',head:true}).eq('match_id',r.match_id).eq('status','accepted');const cap=r.matches?.ticket_capacity;if(cap&&Number(accepted.count||0)>=Number(cap))throw new Error('Bilet kapasitesi doldu.');
  const ticket=r.ticket_number||`KH-${new Date(r.matches.match_date).getFullYear()}-${String(r.id).replace(/-/g,'').slice(0,8).toUpperCase()}`;
  const verifyUrl=`https://karagumrukhentbol.org/?ticket=${encodeURIComponent(ticket)}`;const qrData=await QRCode.toDataURL(verifyUrl,{margin:1,width:360,errorCorrectionLevel:'H'});const qrBytes=Uint8Array.from(atob(qrData.split(',')[1]),c=>c.charCodeAt(0));
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const [regB,boldB,clubB]=await Promise.all([bytes('https://raw.githubusercontent.com/google/fonts/main/ofl/basic/Basic-Regular.ttf'),bytes('https://raw.githubusercontent.com/google/fonts/main/ofl/russoone/RussoOne-Regular.ttf'),bytes('https://karagumrukhentbol.org/assets/club-logo.png')]);const reg=await pdf.embedFont(regB,{subset:true}),bold=await pdf.embedFont(boldB,{subset:true}),club=await pdf.embedPng(clubB),qr=await pdf.embedPng(qrBytes);let opp=club;if(r.matches?.opponent_logo_url)try{opp=await embedImage(pdf,r.matches.opponent_logo_url)}catch{}
  const page=pdf.addPage([842,420]),W=842,H=420,red=rgb(.78,.02,.03),black=rgb(.04,.04,.04),gray=rgb(.35,.35,.35),paper=rgb(.98,.98,.97);page.drawRectangle({x:0,y:0,width:W,height:H,color:paper});page.drawRectangle({x:12,y:12,width:818,height:396,borderColor:black,borderWidth:2});page.drawRectangle({x:20,y:20,width:802,height:380,borderColor:red,borderWidth:2});page.drawRectangle({x:0,y:350,width:842,height:70,color:black});page.drawText('KARAGÜMRÜK HENTBOL',{x:35,y:373,size:24,font:bold,color:rgb(1,1,1)});page.drawText('RESMİ MAÇ BİLETİ',{x:575,y:373,size:18,font:bold,color:red});
  page.drawImage(club,{x:55,y:218,width:105,height:105,opacity:.95});page.drawImage(opp,{x:290,y:218,width:105,height:105,opacity:.95});page.drawText('VS',{x:205,y:255,size:28,font:bold,color:red});page.drawText('KARAGÜMRÜK',{x:48,y:195,size:16,font:bold,color:black});page.drawText(safe(r.matches?.opponent||'RAKİP').toUpperCase(),{x:285,y:195,size:15,font:bold,color:black,maxWidth:150});
  page.drawImage(club,{x:185,y:55,width:190,height:190,opacity:.055});
  const dt=new Date(r.matches.match_date);page.drawText(safe(r.matches?.competition||'Hentbol Maçı'),{x:45,y:155,size:14,font:bold,color:red});page.drawText(`Tarih: ${dt.toLocaleDateString('tr-TR')}`,{x:45,y:125,size:13,font:reg,color:black});page.drawText(`Saat: ${dt.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}`,{x:45,y:101,size:13,font:reg,color:black});page.drawText(`Salon: ${safe(r.matches?.venue||'İstanbul')}`,{x:45,y:77,size:13,font:reg,color:black,maxWidth:420});page.drawText(`Bilet Sahibi: ${safe(r.full_name)}`,{x:45,y:48,size:14,font:bold,color:black,maxWidth:460});
  page.drawRectangle({x:590,y:52,width:190,height:275,borderColor:red,borderWidth:1});page.drawImage(qr,{x:615,y:112,width:140,height:140});page.drawText(ticket,{x:608,y:85,size:11,font:bold,color:black,maxWidth:160});page.drawText('Girişte QR kodu gösteriniz',{x:615,y:65,size:9,font:reg,color:gray});
  const out=await pdf.save();let bin='';for(const b of out)bin+=String.fromCharCode(b);const attachment=btoa(bin);
  const html=`<div style="font-family:Arial;background:#111;padding:28px;color:#fff"><div style="max-width:640px;margin:auto;background:#1b1b1b;border-top:6px solid #c80000;padding:30px"><img src="https://karagumrukhentbol.org/assets/club-logo.png" width="100"><h1>Maç Biletiniz Hazır</h1><p>Sayın ${safe(r.full_name)}, bilet talebiniz onaylandı.</p><p><b>Karagümrük – ${safe(r.matches?.opponent)}</b><br>${dt.toLocaleString('tr-TR')}<br>${safe(r.matches?.venue||'')}</p><p>PDF biletiniz ektedir. Girişte QR kodunu göstermeniz yeterlidir.</p></div></div>`;
  const mail=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resend}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[r.email],subject:`Karagümrük Hentbol - ${ticket}`,html,attachments:[{filename:`${ticket}.pdf`,content:attachment}]})});const mr=await mail.json();if(!mail.ok)throw new Error(mr?.message||'Email gönderilemedi.');
  const {error:u}=await admin.from('ticket_requests').update({status:'accepted',ticket_number:ticket,accepted_at:new Date().toISOString()}).eq('id',id);if(u)throw u;return json({ok:true,ticket_number:ticket});
 }catch(e){console.error(e);return json({ok:false,error:e instanceof Error?e.message:String(e)},400)}
});