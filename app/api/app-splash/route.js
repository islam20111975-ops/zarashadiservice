import {NextResponse} from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/zara-shadi-service/databases/(default)/documents/settings/branding";

export async function GET(request){
  try{
    const response=await fetch(FIRESTORE_URL,{cache:"no-store"});
    if(response.ok){
      const doc=await response.json();
      const value=doc?.fields?.splash?.stringValue||"";
      if(value.startsWith("data:image/")){
        const match=value.match(/^data:(image\/[^;]+);base64,(.+)$/s);
        if(match){
          return new NextResponse(Buffer.from(match[2],"base64"),{
            status:200,
            headers:{
              "Content-Type":match[1],
              "Cache-Control":"no-store, no-cache, must-revalidate, max-age=0",
              "Pragma":"no-cache"
            }
          });
        }
      }
    }
  }catch(e){}
  return NextResponse.redirect(new URL("/zara-icon-512.png",request.url),302);
}
