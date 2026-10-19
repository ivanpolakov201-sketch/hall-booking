CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_time TEXT NOT NULL,
  seat_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(session_time, seat_id)
);
CREATE INDEX IF NOT EXISTS idx_bookings_session ON bookings(session_time);
