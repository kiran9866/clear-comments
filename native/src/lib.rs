use napi_derive::napi;

#[napi(js_name = "stripComments")]
pub fn strip_comments(code: String) -> String {
  let bytes = code.as_bytes();
  let len = bytes.len();
  let mut parts: Vec<&[u8]> = Vec::new();
  let mut keep_from = 0usize;
  let mut i = 0usize;
  let mut prev_sig: u8 = 0;
  let mut prev_word: Option<String> = None;

  while i < len {
    let ch = bytes[i];

    // Strings and template literals
    if ch == b'"' || ch == b'\'' || ch == b'`' {
      let quote = ch;
      i += 1;
      while i < len {
        let c = bytes[i];
        if c == b'\\' {
          i += 2;
          continue;
        }
        i += 1;
        if c == quote {
          break;
        }
      }
      prev_sig = if quote == b'`' { b'`' } else { b'q' };
      prev_word = None;
      continue;
    }

    // Identifier/keyword token
    if is_ident_start(ch) {
      let start = i;
      i += 1;
      while i < len && is_ident_continue(bytes[i]) {
        i += 1;
      }
      prev_word = Some(String::from_utf8_lossy(&bytes[start..i]).to_string());
      prev_sig = b'w';
      continue;
    }

    // Number token
    if ch >= b'0' && ch <= b'9' {
      i += 1;
      while i < len {
        let c = bytes[i];
        if !((c >= b'0' && c <= b'9') || c == b'.' || c == b'_') {
          break;
        }
        i += 1;
      }
      prev_sig = b'n';
      prev_word = None;
      continue;
    }

    // Comment or regex or division
    if ch == b'/' && i + 1 < len {
      let nxt = bytes[i + 1];

      if nxt == b'/' {
        let comment_start = i;
        i += 2;
        while i < len && bytes[i] != b'\n' {
          i += 1;
        }
        // Drop comment range
        if comment_start > keep_from {
          parts.push(&bytes[keep_from..comment_start]);
        }
        keep_from = i;
        prev_word = None;
        continue;
      }

      if nxt == b'*' {
        let comment_start = i;
        i += 2;
        while i + 1 < len {
          if bytes[i] == b'*' && bytes[i + 1] == b'/' {
            i += 2;
            break;
          }
          i += 1;
        }
        if i >= len {
          i = len;
        }
        // Drop comment range
        if comment_start > keep_from {
          parts.push(&bytes[keep_from..comment_start]);
        }
        keep_from = i;
        prev_word = None;
        continue;
      }

      // Check if this is a regex or division
      if is_regex_start(prev_sig, prev_word.as_deref()) {
        i += 1;
        let mut in_class = false;
        while i < len {
          let c = bytes[i];
          if c == b'\\' {
            i += 2;
            continue;
          }
          if c == b'[' {
            in_class = true;
            i += 1;
            continue;
          }
          if c == b']' {
            in_class = false;
            i += 1;
            continue;
          }
          if c == b'/' && !in_class {
            i += 1;
            while i < len && is_ident_continue(bytes[i]) {
              i += 1;
            }
            break;
          }
          i += 1;
        }
        prev_sig = b'r';
        prev_word = None;
        continue;
      }

      prev_sig = b'/';
      prev_word = None;
      i += 1;
      continue;
    }

    // Whitespace skip (but don't output yet)
    if is_whitespace(ch) {
      i += 1;
      continue;
    }

    prev_sig = ch;
    prev_word = None;
    i += 1;
  }

  // Build final output
  if keep_from < len {
    parts.push(&bytes[keep_from..len]);
  }

  let mut result = String::with_capacity(len);
  for part in parts {
    result.push_str(&String::from_utf8_lossy(part));
  }
  result
}

fn is_whitespace(ch: u8) -> bool {
  ch == b' ' || ch == b'\t' || ch == b'\n' || ch == b'\r'
}

fn is_ident_start(ch: u8) -> bool {
  (ch >= b'A' && ch <= b'Z') || (ch >= b'a' && ch <= b'z') || ch == b'_' || ch == b'$'
}

fn is_ident_continue(ch: u8) -> bool {
  is_ident_start(ch) || (ch >= b'0' && ch <= b'9')
}

fn is_regex_start(prev_sig: u8, prev_word: Option<&str>) -> bool {
  if prev_sig == 0 {
    return true;
  }

  if prev_sig == b'w' {
    if let Some(word) = prev_word {
      return matches!(
        word,
        "return" | "throw" | "case" | "delete" | "void" | "typeof" | "yield" | "await" | "in"
          | "of" | "new"
      );
    }
  }

  matches!(
    prev_sig,
    b'(' | b'{' | b'[' | b',' | b';' | b':' | b'=' | b'!' | b'?' | b'~' | b'&' | b'|' | b'^'
      | b'+' | b'-' | b'*' | b'%' | b'<' | b'>'
  )
}
