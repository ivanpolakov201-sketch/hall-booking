export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const session = url.searchParams.get("session") || "16:00";
  if (!/^\d{2}:\d{2}$/.test(session)) return json({error:"Некорректный сеанс"},400);
  if (!env.DB) return json({bookings:[],storageReady:false});
  try {
    const result = await env.DB.prepare(
      "SELECT seat_id, customer_name, created_at FROM bookings WHERE session_time = ?"
    ).bind(session).all();
    return json({bookings:result.results || [],storageReady:true});
  } catch (e) { return json({error:"Не удалось прочитать брони"},500); }
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Access-Control-Allow-Origin":"*"}});}
