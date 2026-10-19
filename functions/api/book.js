const TIMES = new Set(["14:00","16:00","18:00","20:00","21:15","23:35"]);
const LAYOUT = [
  Array.from({length:13},(_,i)=>i+1), Array.from({length:13},(_,i)=>i+1),
  Array.from({length:13},(_,i)=>i+1), Array.from({length:13},(_,i)=>i+1),
  Array.from({length:13},(_,i)=>i+1), Array.from({length:12},(_,i)=>i+1),
  [...[1,2],...Array.from({length:12},(_,i)=>i+3)],
  [...[1,2,3],...Array.from({length:12},(_,i)=>i+3)]
];
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({error:"База данных не подключена. Настройте D1 по инструкции README."},503);
  let body;
  try { body = await request.json(); } catch { return json({error:"Некорректный запрос"},400); }
  const session=String(body.session||"");
  const name=String(body.name||"").trim();
  const seats=Array.isArray(body.seats)?[...new Set(body.seats.map(String))]:[];
  if(!TIMES.has(session)) return json({error:"Выберите корректный сеанс"},400);
  if(!name || name.length>80) return json({error:"Укажите имя длиной до 80 символов"},400);
  if(!seats.length || seats.length>30) return json({error:"Выберите от 1 до 30 мест"},400);
  const valid=new Set(LAYOUT.flatMap((nums,i)=>nums.map(n=>`${i+1}-${n}`)));
  if(seats.some(s=>!valid.has(s))) return json({error:"В запросе есть некорректные места"},400);
  try {
    // D1 batch executes statements transactionally. The UNIQUE index prevents two users
    // from reserving the same seat for the same session.
    const statements=seats.map(seat=>env.DB.prepare(
      "INSERT INTO bookings (session_time, seat_id, customer_name, created_at) VALUES (?, ?, ?, datetime('now'))"
    ).bind(session,seat,name));
    await env.DB.batch(statements);
    return json({ok:true,count:seats.length});
  } catch(e) {
    const message=String(e?.message||e);
    if(message.includes("UNIQUE")||message.includes("constraint")) return json({error:"Одно из мест уже забронировано"},409);
    return json({error:"Не удалось сохранить бронь. Проверьте настройку базы данных."},500);
  }
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});}
