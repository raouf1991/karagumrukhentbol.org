import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});

Deno.serve(async req=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:corsHeaders});
  try{
    const supabaseUrl=Deno.env.get('SUPABASE_URL');
    const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendKey=Deno.env.get('RESEND_API_KEY');
    const from=Deno.env.get('RESEND_FROM_EMAIL');
    if(!supabaseUrl||!serviceKey) throw new Error('Supabase secrets are missing.');
    const auth=req.headers.get('Authorization')||'';
    const userDb=createClient(supabaseUrl,Deno.env.get('SUPABASE_ANON_KEY')||'',{global:{headers:{Authorization:auth}}});
    const {data:{user}}=await userDb.auth.getUser();
    if(!user) return json({ok:false,error:'Unauthorized'},401);
    const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}});
    const {action,id}=await req.json();
    if(!id||!['accept','delete'].includes(action)) throw new Error('Invalid action.');
    if(action==='delete'){
      const {error}=await admin.from('donation_requests').delete().eq('id',id);
      if(error) throw error;
      return json({ok:true});
    }
    if(!resendKey||!from) throw new Error('Resend secrets are missing.');
    const {data:a,error:readError}=await admin.from('donation_requests').select('*').eq('id',id).single();
    if(readError||!a) throw readError||new Error('Donation request not found.');
    const cert=a.certificate_number||`KH-DON-${new Date().getFullYear()}-${String(a.id).replace(/-/g,'').slice(0,8).toUpperCase()}`;
    const pdf=await PDFDocument.create();
    const page=pdf.addPage([842,595]);
    const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
    const regular=await pdf.embedFont(StandardFonts.Helvetica);
    page.drawRectangle({x:0,y:0,width:842,height:595,color:rgb(.055,.055,.055)});
    page.drawRectangle({x:28,y:28,width:786,height:539,borderColor:rgb(.82,.03,.03),borderWidth:5});
    page.drawText('KARAGUMRUK HENTBOL',{x:210,y:485,size:34,font:bold,color:rgb(1,1,1)});
    page.drawText('CERTIFICATE OF APPRECIATION',{x:225,y:432,size:22,font:bold,color:rgb(.9,.12,.12)});
    page.drawText('This certificate is proudly presented to',{x:285,y:382,size:15,font:regular,color:rgb(.82,.82,.82)});
    page.drawText(String(a.full_name),{x:170,y:320,size:34,font:bold,color:rgb(1,1,1),maxWidth:500});
    const detail=a.donation_type==='cash'?`${a.amount||''} ${a.currency||''} cash contribution`:`in-kind contribution: ${a.item_name||'support'}`;
    page.drawText(`With sincere gratitude for the ${detail} made in support of our club and young athletes.`,{x:120,y:255,size:15,font:regular,color:rgb(.88,.88,.88),maxWidth:600,lineHeight:22});
    page.drawText(`Certificate No: ${cert}`,{x:70,y:85,size:11,font:regular,color:rgb(.72,.72,.72)});
    page.drawText(new Date().toLocaleDateString('tr-TR'),{x:650,y:85,size:11,font:regular,color:rgb(.72,.72,.72)});
    page.drawText('Raouf Tarek',{x:590,y:150,size:24,font:bold,color:rgb(1,1,1)});
    page.drawText('Club President',{x:615,y:128,size:12,font:regular,color:rgb(.8,.8,.8)});
    const bytes=await pdf.save();
    let binary=''; for(const b of bytes) binary+=String.fromCharCode(b); const attachment=btoa(binary);
    const html=`<div style="font-family:Arial;background:#151515;color:#fff;padding:30px"><div style="max-width:640px;margin:auto;background:#0d0d0d;border:1px solid #333;border-radius:16px;overflow:hidden"><div style="text-align:center;padding:28px;border-bottom:5px solid #d50909"><img src="https://karagumrukhentbol.org/assets/club-logo.png" width="100"><h1>KARAGÜMRÜK HENTBOL</h1></div><div style="padding:32px"><h2>Teşekkürler, ${String(a.full_name).replace(/[<>&]/g,'')}!</h2><p style="font-size:18px;line-height:1.7;color:#ddd">Kulübümüze yaptığınız değerli katkı için içtenlikle teşekkür ederiz. Desteğiniz gençlerin sporda kalmasına, kötü alışkanlıklardan uzaklaşmasına ve toplumumuza faydalı bireyler olarak yetişmesine yardımcı olmaktadır.</p><p style="font-size:17px;color:#bbb">Teşekkür belgeniz bu e-postaya PDF olarak eklenmiştir.</p><div style="margin-top:35px"><strong style="font-size:22px">Raouf Tarek</strong><br><span style="color:#bbb">Kulüp Başkanı / Club President</span></div></div></div></div>`;
    const mail=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[a.email],subject:'Karagümrük Hentbol - Teşekkür Belgesi',html,attachments:[{filename:`Karagumruk-Donation-Certificate-${cert}.pdf`,content:attachment}]})});
    const mailResult=await mail.json(); if(!mail.ok) throw new Error(mailResult?.message||'Email could not be sent.');
    const {error:updateError}=await admin.from('donation_requests').update({status:'accepted',certificate_number:cert,accepted_at:new Date().toISOString()}).eq('id',id);
    if(updateError) throw updateError;
    return json({ok:true,certificate_number:cert});
  }catch(e){return json({ok:false,error:e instanceof Error?e.message:String(e)},400);}
});