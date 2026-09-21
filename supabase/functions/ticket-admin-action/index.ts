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
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const [regB,boldB,clubB]=await Promise.all([bytes('https://raw.githubusercontent.com/google/fonts/main/ofl/basic/Basic-Regular.ttf'),bytes('https://raw.githubusercontent.com/google/fonts/main/ofl/russoone/RussoOne-Regular.ttf'),bytes('https://karagumrukhentbol.org/assets/club-logo-ticket-transparent-2.png?v=20260919')]);const reg=await pdf.embedFont(regB,{subset:true}),bold=await pdf.embedFont(boldB,{subset:true}),club=await pdf.embedPng(clubB),qr=await pdf.embedPng(qrBytes);let opp=club;if(r.matches?.opponent_logo_url)try{opp=await embedImage(pdf,r.matches.opponent_logo_url)}catch{}
  // Ticket PDF presentation only. QR payload, issuing workflow and email are unchanged.
  // 254 x 120 mm landscape, with a dedicated scan stub and print-safe margins.
  const page=pdf.addPage([720,340]),W=720,H=340;
  const red=rgb(.85,.035,.07),ink=rgb(.055,.065,.085),gray=rgb(.36,.39,.43),line=rgb(.86,.88,.90),white=rgb(1,1,1),paper=rgb(.96,.97,.98);
  const clean=(value:unknown)=>safe(value).replace(/\s+/g,' ').trim();
  const fit=(value:unknown,font:any,size:number,width:number)=>{
    const text=clean(value);let actual=size;
    while(actual>5&&font.widthOfTextAtSize(text,actual)>width)actual-=.25;
    return {text,size:actual};
  };
  const text=(value:unknown,x:number,y:number,size:number,width:number,font:any=reg,color:any=ink,align='left')=>{
    const f=fit(value,font,size,width),offset=align==='center'?(width-font.widthOfTextAtSize(f.text,f.size))/2:0;
    page.drawText(f.text,{x:x+offset,y,size:f.size,font,color});
  };
  const wrapped=(value:unknown,x:number,y:number,width:number,size:number,maxLines:number,font:any=reg,color:any=ink,align='left')=>{
    const content=clean(value);let actual=size,rows:string[]=[];
    while(actual>=6){
      rows=[];let row='';
      for(const word of content.split(' ')){
        const next=row?`${row} ${word}`:word;
        if(row&&font.widthOfTextAtSize(next,actual)>width){rows.push(row);row=word;}else row=next;
      }
      if(row)rows.push(row);
      if(rows.length<=maxLines&&rows.every(v=>font.widthOfTextAtSize(v,actual)<=width))break;
      actual-=.5;
    }
    rows.forEach((row,i)=>text(row,x,y-i*(actual+3),actual,width,font,color,align));
  };
  const logo=(image:any,cx:number,cy:number)=>{
    page.drawCircle({x:cx,y:cy,size:41,color:white,borderColor:line,borderWidth:.6});
    const scale=Math.min(72/image.width,72/image.height);
    page.drawImage(image,{x:cx-image.width*scale/2,y:cy-image.height*scale/2,width:image.width*scale,height:image.height*scale});
  };
  page.drawRectangle({x:0,y:0,width:W,height:H,color:white});
  page.drawRectangle({x:0,y:282,width:W,height:58,color:ink});
  page.drawRectangle({x:0,y:282,width:5,height:58,color:red});
  text('KARAGÜMRÜK HENTBOL',28,310,21,470,bold,white);
  text('SPOR KULÜBÜ  /  RESMİ MAÇ BİLETİ',29,294,8,470,reg,rgb(.76,.78,.82));
  text('E-BİLET',548,307,19,146,bold,white,'center');
  page.drawRectangle({x:0,y:277,width:W,height:5,color:red});
  page.drawRectangle({x:526,y:0,width:194,height:277,color:paper});
  for(let y=18;y<270;y+=10)page.drawLine({start:{x:526,y},end:{x:526,y:y+4},thickness:.7,color:line});
  text(clean(r.matches?.competition||'Hentbol Maçı').toLocaleUpperCase('tr-TR'),28,255,10,470,bold,red);
  logo(club,140,201);logo(opp,386,201);
  text('VS',240,190,22,46,bold,red,'center');
  wrapped('KARAGÜMRÜK HENTBOL',36,145,208,13,2,bold,ink,'center');
  wrapped(clean(r.matches?.opponent||'RAKİP').toLocaleUpperCase('tr-TR'),282,145,208,13,2,bold,ink,'center');
  page.drawLine({start:{x:28,y:114},end:{x:498,y:114},thickness:.7,color:line});
  const dt=new Date(r.matches.match_date);
  text('TARİH',28,99,7.5,110,reg,gray);
  text(dt.toLocaleDateString('tr-TR'),28,81,14,128,bold);
  text('SAAT',178,99,7.5,70,reg,gray);
  text(dt.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}),178,81,14,70,bold);
  text('SALON',278,99,7.5,220,reg,gray);
  wrapped(r.matches?.venue||'İstanbul',278,82,220,11,2,reg);
  page.drawRectangle({x:0,y:0,width:526,height:56,color:ink});
  page.drawRectangle({x:0,y:0,width:5,height:56,color:red});
  text('BİLET SAHİBİ',28,39,7.5,470,reg,rgb(.73,.76,.80));
  text(r.full_name,28,17,16,470,bold,white);
  text('GİRİŞ KODU',546,254,9,154,bold,gray,'center');
  // Leave additional white quiet space around the unchanged QR image.
  page.drawRectangle({x:545,y:87,width:156,height:156,color:white});
  page.drawImage(qr,{x:553,y:95,width:140,height:140});
  text(ticket,538,69,11,170,bold,ink,'center');
  text('Girişte QR kodu gösteriniz',539,49,8,168,reg,gray,'center');
  page.drawLine({start:{x:547,y:34},end:{x:699,y:34},thickness:.7,color:line});
  text('karagumrukhentbol.org',538,17,8,170,reg,gray,'center');
  const out=await pdf.save();let bin='';for(const b of out)bin+=String.fromCharCode(b);const attachment=btoa(bin);
  const html=`<div style="font-family:Arial;background:#111;padding:28px;color:#fff"><div style="max-width:640px;margin:auto;background:#1b1b1b;border-top:6px solid #c80000;padding:30px"><img src="https://raw.githubusercontent.com/raouf1991/karagumrukhentbol.org/main/assets/club-logo-ticket-transparent-2.png" width="100" height="100" alt="Karagümrük Hentbol" style="display:block;width:100px;height:100px;object-fit:contain;border:0;"><h1>Maç Biletiniz Hazır</h1><p>Sayın ${safe(r.full_name)}, bilet talebiniz onaylandı.</p><p><b>Karagümrük – ${safe(r.matches?.opponent)}</b><br>${dt.toLocaleString('tr-TR')}<br>${safe(r.matches?.venue||'')}</p><p>PDF biletiniz ektedir. Girişte QR kodunu göstermeniz yeterlidir.</p></div></div>`;
  const mail=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resend}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[r.email],subject:`Karagümrük Hentbol - ${ticket}`,html,attachments:[{filename:`${ticket}.pdf`,content:attachment}]})});const mr=await mail.json();if(!mail.ok)throw new Error(mr?.message||'Email gönderilemedi.');
  const {error:u}=await admin.from('ticket_requests').update({status:'accepted',ticket_number:ticket,accepted_at:new Date().toISOString()}).eq('id',id);if(u)throw u;return json({ok:true,ticket_number:ticket});
 }catch(e){console.error(e);return json({ok:false,error:e instanceof Error?e.message:String(e)},400)}
});
