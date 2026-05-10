//! Embedding wrapper.
//!
//! In the default build we use a small **deterministic hashed-token bag**
//! embedding. It's not state of the art but it's:
//! - zero network, zero model download (good first-run UX)
//! - fast (microseconds per chunk)
//! - cosine-comparable
//! - swappable for fastembed BGE-small via `--features embed`
//!
//! For the public release the `embed` feature should be on by default once
//! we've verified ORT builds cleanly on the CI matrix. See NOTES.md.

use anyhow::Result;

pub const DIM: usize = 256;

#[cfg(not(feature = "embed"))]
pub struct Embedder;

#[cfg(not(feature = "embed"))]
impl Embedder {
    pub fn new() -> Result<Self> {
        Ok(Self)
    }

    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        Ok(hashed_bag(text, DIM))
    }
}

#[cfg(feature = "embed")]
pub struct Embedder {
    inner: fastembed::TextEmbedding,
}

#[cfg(feature = "embed")]
impl Embedder {
    pub fn new() -> Result<Self> {
        use fastembed::{InitOptions, TextEmbedding};
        let inner = TextEmbedding::try_new(InitOptions::default())?;
        Ok(Self { inner })
    }

    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        let v = self.inner.embed(vec![text.to_string()], None)?;
        Ok(v.into_iter().next().unwrap_or_default())
    }
}

/// Cheap hashing-trick bag-of-tokens used as a stand-in embedder.
///
/// Tokens are lowercased ASCII word runs. Each token hashes to a bucket
/// (sign included) and contributes its IDF-ish weight (1/log(len)).
pub fn hashed_bag(text: &str, dim: usize) -> Vec<f32> {
    let mut v = vec![0.0f32; dim];
    let mut count = 0usize;
    for raw in text.split(|c: char| !c.is_alphanumeric()) {
        if raw.is_empty() {
            continue;
        }
        let tok = raw.to_ascii_lowercase();
        let h = fnv1a(tok.as_bytes());
        let idx = (h as usize) % dim;
        let sign = if (h >> 32) & 1 == 0 { 1.0 } else { -1.0 };
        v[idx] += sign;
        count += 1;
    }
    if count == 0 {
        return v;
    }
    // L2 normalize so cosine == dot.
    let norm = v.iter().map(|x| x * x).sum::<f32>().sqrt();
    if norm > 0.0 {
        for x in &mut v {
            *x /= norm;
        }
    }
    v
}

fn fnv1a(bytes: &[u8]) -> u64 {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for &b in bytes {
        h ^= b as u64;
        h = h.wrapping_mul(0x0000_0100_0000_01B3);
    }
    h
}

/// Cosine similarity. Both vectors are assumed to be the same length.
pub fn cosine(a: &[f32], b: &[f32]) -> f32 {
    let mut dot = 0.0;
    let mut na = 0.0;
    let mut nb = 0.0;
    for (x, y) in a.iter().zip(b.iter()) {
        dot += x * y;
        na += x * x;
        nb += y * y;
    }
    let d = (na.sqrt() * nb.sqrt()).max(1e-12);
    dot / d
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cosine_identical() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        assert!((cosine(&a, &b) - 1.0).abs() < 1e-6);
    }

    #[test]
    fn cosine_orthogonal() {
        let a = vec![1.0, 0.0];
        let b = vec![0.0, 1.0];
        assert!(cosine(&a, &b).abs() < 1e-6);
    }

    #[test]
    fn embed_deterministic() {
        let e = Embedder::new().unwrap();
        let a = e.embed("hello world").unwrap();
        let b = e.embed("hello world").unwrap();
        assert_eq!(a, b);
        assert_eq!(a.len(), DIM);
    }

    #[test]
    fn similar_text_more_similar_than_unrelated() {
        let e = Embedder::new().unwrap();
        let a = e.embed("error connecting to database").unwrap();
        let b = e.embed("database connection error").unwrap();
        let c = e.embed("the quick brown fox jumps").unwrap();
        assert!(cosine(&a, &b) > cosine(&a, &c));
    }
}
