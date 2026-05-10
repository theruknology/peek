//! Regex-based secret redaction applied at capture time.
//!
//! Defaults are conservative: catch obvious credentials. False positives
//! are preferable to leaks. Users can disable individual rules in v0.2.

use once_cell::sync::Lazy;
use regex::Regex;

struct Rule {
    name: &'static str,
    re: Regex,
}

static RULES: Lazy<Vec<Rule>> = Lazy::new(|| {
    vec![
        Rule {
            name: "AWS_ACCESS_KEY",
            re: Regex::new(r"AKIA[0-9A-Z]{16}").unwrap(),
        },
        Rule {
            name: "ANTHROPIC_KEY",
            re: Regex::new(r"sk-ant-[A-Za-z0-9_\-]{20,}").unwrap(),
        },
        Rule {
            name: "OPENAI_KEY",
            re: Regex::new(r"sk-[A-Za-z0-9]{32,}").unwrap(),
        },
        Rule {
            name: "JWT",
            re: Regex::new(r"eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+").unwrap(),
        },
        Rule {
            name: "ENV_SECRET",
            re: Regex::new(r"([A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASSWD))=\S+").unwrap(),
        },
    ]
});

/// Replace anything matching the rule set with `<REDACTED:NAME>`.
pub fn redact(input: &str) -> String {
    let mut out = input.to_string();
    for rule in RULES.iter() {
        let tag = format!("<REDACTED:{}>", rule.name);
        // For ENV_SECRET, keep the variable name so logs remain readable.
        if rule.name == "ENV_SECRET" {
            out = rule
                .re
                .replace_all(&out, format!("$1=<REDACTED:{}>", rule.name).as_str())
                .into_owned();
        } else {
            out = rule.re.replace_all(&out, tag.as_str()).into_owned();
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aws_key() {
        let s = "creds AKIAIOSFODNN7EXAMPLE were leaked";
        assert!(redact(s).contains("<REDACTED:AWS_ACCESS_KEY>"));
    }

    #[test]
    fn anthropic_key() {
        let s = "ANTHROPIC=sk-ant-abcdefghijklmnopqrstuv";
        assert!(redact(s).contains("REDACTED"));
    }

    #[test]
    fn openai_key() {
        let s = "OPENAI=sk-abcdefghijklmnopqrstuvwxyz0123456789";
        assert!(redact(s).contains("REDACTED"));
    }

    #[test]
    fn jwt() {
        let s = "Bearer eyJhbGciOi.eyJzdWIiOi.SflKxwRJSMeKKF";
        assert!(redact(s).contains("<REDACTED:JWT>"));
    }

    #[test]
    fn env_secret() {
        let s = "GITHUB_TOKEN=ghp_thisIsASecretValue123";
        let r = redact(s);
        assert!(r.contains("GITHUB_TOKEN=<REDACTED:ENV_SECRET>"));
    }

    #[test]
    fn passthrough_safe() {
        let s = "no secrets here, just words";
        assert_eq!(redact(s), s);
    }
}
