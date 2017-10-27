const child_process = require("child_process");
const ImageRequest = require("../structures/image/ImageRequest");
const net = require("net");
const openPort = require("openport");

class ImageHandling {
    static startProcess(message) {
        try {
            const request = new ImageRequest(message);
            return new Promise((resolve, reject) => {
                openPort.find((openPortErr, port) => { // eslint-disable-line
                    if (openPortErr) reject(openPortErr);
                    const bufs = [];
                    const server = net.createServer((socket) => {
                        socket.name = "master";
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
            return console.error(err);
        }
    }
}

module.exports = ImageHandling;