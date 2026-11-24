import { stdin, stdout } from "../streams.ts";

const buf = new Uint8Array(1024);
let bytesRead = 0;
let go = true;

while (go) {
  const r = await stdin.read(buf);
  if (r === null) {
    go = false;
    break;
  } else {
    bytesRead = r;
  }

  if (bytesRead && bytesRead > 0) {
    await stdout.write(buf.subarray(0, bytesRead));
  }
}
