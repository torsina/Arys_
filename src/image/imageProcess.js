const Canvas = require("canvas");
const constants = require("../util/constants");
Canvas.registerFont("../Whitney_Book.ttf", { family: "Whitney" });

const net = require("net");
const client = new net.Socket();

function eventLoop() {
    process.once("message", (message) => {
        if (!message.type) return eventLoop();
        else {
            // connect to the socket
            client.connect(parseInt(process.env.port), () => {
                let canvas;
                switch (message.type) {
                    case "role": {
                        const config = constants.IMAGE_ROLESHOP;
                        const itemLength = message.items.length;
                        canvas = new Canvas(804, itemLength * 32);
                        const ctx = canvas.getContext("2d");
                        for (let i = 0; i < itemLength; i++) {
                            ctx.fillStyle = (i % 2) === 1 ? config.colors[0] : config.colors[1];
                            ctx.fillRect(0, i * 32, 804, 32);
                        }
                        Object.assign(ctx, config.ctx);
                        for (let i = 0; i < itemLength; i++) {
                            const item = message.items[i];
                            const yPos = ((i + 1) * 24) + (i * 8);
                            ctx.fillStyle = item.hex;
                            ctx.fillText(item.name, config.startText, yPos);
                            ctx.fillStyle = "white";
                            ctx.fillText(item.price.toString(), config.startPrice, yPos);
                        }
                        break;
                    }
                }
                const buffer = canvas.toBuffer();
                // send the cache and close the connection
                client.end(buffer);
            });
        }
    });
}
eventLoop();