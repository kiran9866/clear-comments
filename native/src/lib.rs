use napi_derive::napi;

#[napi(js_name = "stripComments")]
pub fn strip_comments(code: String) -> String {
  let bytes = code.as_bytes();
  let len = bytes.len();
  let mut out = String::with_capacity(len);

  let mut i = 0usize;
  while i < len {
    let ch = bytes[i];

    if ch == b'"' || ch == b'\'' || ch == b'`' {
      let quote = ch;
      out.push(ch as char);
      i += 1;
      while i < len {
        let c = bytes[i];
        out.push(c as char);
        if c == b'\\' {
          i += 1;
          if i < len {
            out.push(bytes[i] as char);
            i += 1;
          }
          continue;
        }
        i += 1;
        if c == quote {
          break;
        }
      }
      continue;
    }

    if ch == b'/' && i + 1 < len {
      let nxt = bytes[i + 1];

      if nxt == b'/' {
        i += 2;
        while i < len && bytes[i] != b'\n' {
          i += 1;
        }
        continue;
      }

      if nxt == b'*' {
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
        continue;
      }
    }

    out.push(ch as char);
    i += 1;
  }

  out
}
