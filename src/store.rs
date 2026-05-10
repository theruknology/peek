//! SQLite-backed chunk store with brute-force cosine search.
//!
//! Vectors are persisted as little-endian f32 BLOBs. For the MVP we
//! brute-force scan in Rust at query time — fine through ~1M chunks
//! (a few hundred ms). Swap to sqlite-vec or HNSW later; the schema
//! is forward-compatible.

use anyhow::{Context, Result};
use rusqlite::{params, Connection, OptionalExtension};
use std::path::PathBuf;

use crate::embed::cosine;

pub struct Store {
    conn: Connection,
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct Chunk {
    pub id: i64,
    pub pane_id: String,
    pub session: String,
    pub ts: i64,
    pub content: String,
}

#[derive(Debug, Clone)]
pub struct Hit {
    pub chunk: Chunk,
    pub score: f32,
}

#[derive(Debug, Default, Clone)]
pub struct Stats {
    pub chunks: i64,
    pub panes: i64,
    pub bytes: i64,
}

impl Store {
    pub fn db_path() -> Result<PathBuf> {
        let base = dirs::data_local_dir()
            .or_else(dirs::data_dir)
            .unwrap_or_else(|| PathBuf::from("."));
        Ok(base.join("peek").join("db.sqlite"))
    }

    pub fn open() -> Result<Self> {
        let p = Self::db_path()?;
        if let Some(parent) = p.parent() {
            std::fs::create_dir_all(parent)
                .with_context(|| format!("creating {}", parent.display()))?;
        }
        let conn = Connection::open(&p)?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "synchronous", "NORMAL")?;
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS chunks (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                pane_id   TEXT NOT NULL,
                session   TEXT NOT NULL,
                ts        INTEGER NOT NULL,
                content   TEXT NOT NULL,
                embedding BLOB NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_chunks_pane ON chunks(pane_id);
            CREATE INDEX IF NOT EXISTS idx_chunks_ts   ON chunks(ts);
            "#,
        )?;
        Ok(Self { conn })
    }

    pub fn insert_chunk(
        &self,
        pane_id: &str,
        session: &str,
        ts: i64,
        content: &str,
        embedding: &[f32],
    ) -> Result<i64> {
        let blob = vec_to_blob(embedding);
        self.conn.execute(
            "INSERT INTO chunks(pane_id, session, ts, content, embedding) VALUES (?, ?, ?, ?, ?)",
            params![pane_id, session, ts, content, blob],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn query(&self, q: &[f32], k: usize) -> Result<Vec<Hit>> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, pane_id, session, ts, content, embedding FROM chunks")?;
        let rows = stmt.query_map([], |row| {
            let blob: Vec<u8> = row.get(5)?;
            Ok((
                Chunk {
                    id: row.get(0)?,
                    pane_id: row.get(1)?,
                    session: row.get(2)?,
                    ts: row.get(3)?,
                    content: row.get(4)?,
                },
                blob,
            ))
        })?;

        let mut heap: Vec<Hit> = Vec::new();
        for r in rows {
            let (chunk, blob) = r?;
            let v = blob_to_vec(&blob);
            if v.len() != q.len() {
                continue;
            }
            let s = cosine(q, &v);
            heap.push(Hit { chunk, score: s });
        }
        heap.sort_by(|a, b| {
            b.score
                .partial_cmp(&a.score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        heap.truncate(k);
        Ok(heap)
    }

    pub fn stats(&self) -> Result<Stats> {
        let chunks: i64 = self
            .conn
            .query_row("SELECT COUNT(*) FROM chunks", [], |r| r.get(0))
            .optional()?
            .unwrap_or(0);
        let panes: i64 = self
            .conn
            .query_row("SELECT COUNT(DISTINCT pane_id) FROM chunks", [], |r| {
                r.get(0)
            })
            .optional()?
            .unwrap_or(0);
        let bytes: i64 = self
            .conn
            .query_row(
                "SELECT COALESCE(SUM(LENGTH(content)+LENGTH(embedding)), 0) FROM chunks",
                [],
                |r| r.get(0),
            )
            .optional()?
            .unwrap_or(0);
        Ok(Stats {
            chunks,
            panes,
            bytes,
        })
    }
}

fn vec_to_blob(v: &[f32]) -> Vec<u8> {
    let mut out = Vec::with_capacity(v.len() * 4);
    for x in v {
        out.extend_from_slice(&x.to_le_bytes());
    }
    out
}

fn blob_to_vec(b: &[u8]) -> Vec<f32> {
    let mut out = Vec::with_capacity(b.len() / 4);
    for chunk in b.chunks_exact(4) {
        let mut buf = [0u8; 4];
        buf.copy_from_slice(chunk);
        out.push(f32::from_le_bytes(buf));
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn blob_roundtrip() {
        let v = vec![1.0_f32, -2.5, 3.25, 0.0];
        let b = vec_to_blob(&v);
        let r = blob_to_vec(&b);
        assert_eq!(v, r);
    }
}
