import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb } from 'https://esm.sh/pdf-lib@1.17.1';
import fontkit from 'https://esm.sh/@pdf-lib/fontkit@1.1.1';

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
const safe=(value:unknown)=>String(value??'').replace(/[<>&]/g,'');

async function fetchBytes(url:string){
  const response=await fetch(url);
  if(!response.ok) throw new Error(`Asset could not be loaded: ${url}`);
  return new Uint8Array(await response.arrayBuffer());
}

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
    pdf.registerFontkit(fontkit);

    const [regularBytes,boldBytes,scriptBytes,logoBytes]=await Promise.all([
      fetchBytes('https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/static/NotoSerif-Regular.ttf'),
      fetchBytes('https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/static/NotoSerif-Bold.ttf'),
      fetchBytes('https://raw.githubusercontent.com/google/fonts/main/ofl/dancingscript/static/DancingScript-Bold.ttf'),
      fetchBytes('https://karagumrukhentbol.org/assets/club-logo.png')
    ]);

    const regular=await pdf.embedFont(regularBytes,{subset:true});
    const bold=await pdf.embedFont(boldBytes,{subset:true});
    const script=await pdf.embedFont(scriptBytes,{subset:true});
    const logo=await pdf.embedPng(logoBytes);

    const page=pdf.addPage([842,595]);
    const W=842,H=595;
    const red=rgb(.78,.02,.03), black=rgb(.045,.045,.045), gray=rgb(.34,.34,.34), paper=rgb(.995,.99,.975);
    page.drawRectangle({x:0,y:0,width:W,height:H,color:paper});

    // Modern certificate frame and sports-inspired corner ribbons.
    page.drawRectangle({x:14,y:14,width:814,height:567,borderColor:black,borderWidth:2});
    page.drawRectangle({x:22,y:22,width:798,height:551,borderColor:red,borderWidth:1.4});
    page.drawLine({start:{x:0,y:595},end:{x:250,y:595},thickness:28,color:black});
    page.drawLine({start:{x:0,y:575},end:{x:205,y:595},thickness:18,color:red});
    page.drawLine({start:{x:842,y:0},end:{x:625,y:0},thickness:30,color:black});
    page.drawLine({start:{x:842,y:22},end:{x:675,y:0},thickness:18,color:red});

    const logoScale=Math.min(120/logo.width,105/logo.height);
    const lw=logo.width*logoScale,lh=logo.height*logoScale;
    page.drawImage(logo,{x:(W-lw)/2,y:470,width:lw,height:lh});

    const centerText=(text:string,y:number,size:number,font:any,color=black)=>{
      const width=font.widthOfTextAtSize(text,size);
      page.drawText(text,{x:(W-width)/2,y,size,font,color});
    };

    centerText('TEŞEKKÜR BELGESİ',405,38,bold,black);
    page.drawLine({start:{x:300,y:391},end:{x:542,y:391},thickness:1.7,color:red});
    centerText("Karagümrük Hentbol Spor Kulübü’ne göstermiş olduğunuz",355,15,regular,gray);
    centerText('değerli ilgi, katkı ve destekleriniz için',331,15,regular,gray);

    let nameSize=42;
    const donor=safe(a.full_name);
    while(script.widthOfTextAtSize(donor,nameSize)>550&&nameSize>28) nameSize-=2;
    centerText(donor,265,nameSize,script,black);
    page.drawLine({start:{x:185,y:252},end:{x:657,y:252},thickness:1.2,color:red});

    centerText('Kulübümüze sunduğunuz değerli destek, gençlerimizin sporla',218,14,regular,gray);
    centerText('yetişmesine, hedeflerine ulaşmasına ve topluma faydalı bireyler',195,14,regular,gray);
    centerText('olarak geleceğe hazırlanmasına büyük güç katmaktadır.',172,14,regular,gray);
    centerText('Katkılarınız için teşekkür eder, şükranlarımızı sunarız.',137,15,bold,black);

    const date=new Date().toLocaleDateString('tr-TR');
    page.drawText('Tarih',{x:92,y:75,size:11,font:bold,color:black});
    page.drawLine({start:{x:70,y:68},end:{x:180,y:68},thickness:1,color:red});
    page.drawText(date,{x:91,y:51,size:11,font:regular,color:gray});

    centerText('Karagümrük Hentbol Spor Kulübü',65,11,regular,black);
    centerText('İstanbul',48,10,regular,gray);

    page.drawText('Raouf Tarek',{x:635,y:83,size:25,font:script,color:black});
    page.drawLine({start:{x:622,y:76},end:{x:770,y:76},thickness:1.1,color:red});
    page.drawText('Raouf Tarek',{x:650,y:56,size:12,font:bold,color:red});
    page.drawText('Kulüp Başkanı',{x:655,y:39,size:10,font:regular,color:black});

    const bytes=await pdf.save();
    let binary=''; for(const b of bytes) binary+=String.fromCharCode(b);
    const attachment=btoa(binary);

    const html=`<div style="font-family:Arial;background:#151515;color:#fff;padding:30px"><div style="max-width:640px;margin:auto;background:#0d0d0d;border:1px solid #333;border-radius:16px;overflow:hidden"><div style="text-align:center;padding:28px;border-bottom:5px solid #d50909"><img src="https://karagumrukhentbol.org/assets/club-logo.png" width="120" alt="Karagümrük Hentbol"><h1>KARAGÜMRÜK HENTBOL</h1></div><div style="padding:32px"><h2>Teşekkürler, ${safe(a.full_name)}!</h2><p style="font-size:18px;line-height:1.7;color:#ddd">Kulübümüze sunduğunuz değerli destek için içtenlikle teşekkür ederiz. Katkınız, gençlerimizin sporda kalmasına, kötü alışkanlıklardan uzaklaşmasına ve topluma faydalı bireyler olarak yetişmesine yardımcı olmaktadır.</p><p style="font-size:17px;color:#bbb">Türkçe teşekkür belgeniz bu e-postaya PDF olarak eklenmiştir.</p><div style="margin-top:35px"><strong style="font-size:22px">Raouf Tarek</strong><br><span style="color:#bbb">Kulüp Başkanı</span></div></div></div></div>`;

    const mail=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        from,
        to:[a.email],
        subject:'Karagümrük Hentbol - Teşekkür Belgesi',
        html,
        attachments:[{filename:`Karagumruk-Tesekkur-Belgesi-${cert}.pdf`,content:attachment}]
      })
    });
    const mailResult=await mail.json();
    if(!mail.ok) throw new Error(mailResult?.message||'Email could not be sent.');

    const {error:updateError}=await admin.from('donation_requests').update({status:'accepted',certificate_number:cert,accepted_at:new Date().toISOString()}).eq('id',id);
    if(updateError) throw updateError;
    return json({ok:true,certificate_number:cert});
  }catch(e){
    return json({ok:false,error:e instanceof Error?e.message:String(e)},400);
  }
});