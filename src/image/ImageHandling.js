const child_process = require("child_process");
const ImageRequest = require("./ImageRequest");
const net = require("net");
const op = require("openport");

class ImageHandling {
    static startProcess(message) {
        try {
            const request = new ImageRequest(message);
            return new Promise((resolve, reject) => {
                op.find((openPortErr, port) => { // eslint-disable-line
                    if (openPortErr) reject(openPortErr);
                    const bufs = [];
                    const server = net.createServer((socket) => {
                        socket.on("data", (data) => {
                            bufs.push(data);
                        });
                        socket.on("end", () => {
                            server.close();
                            resolve(Buffer.concat(bufs));
                        });
                        socket.on("error", socketErr => reject(socketErr));
                    }).listen(port);
                    const child = child_process.fork("./image/imageProcess.js", { env: { port } });
                    child.send(request);
                });
            });
        } catch (err) {
            throw err;
        }
    }
}

module.exports = ImageHandling;