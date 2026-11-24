import { stdin, stdout } from "../streams.ts";

const buf = new Uint8Array(1024);
let bytesRead = 0;
let go = true;
while (go) {
  const r = stdin.readSync(buf);
  if (r === null) {
    go = false;
    break;
  } else {
    bytesRead = r;
  }

  if (go && bytesRead > 0) {
    stdout.writeSync(buf.subarray(0, bytesRead));
  }
}
