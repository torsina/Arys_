const Canvas = require("canvas");
const constants = require("../util/constants");
Canvas.registerFont("../Whitney_Book.ttf", { family: "Whitney" });
const s = require("net").connect(parseInt(process.env.port));

function eventLoop() {
    process.once("message", (message) => {
        if (!message.type) return eventLoop();
        else {
            const { data } = message;
            switch (message.type) {
                case "roleShop": {
                    const config = constants.IMAGE_ROLESHOP;
                    const itemLength = data.list.length;
                    const canvas = new Canvas(804, itemLength * 32);
                    const ctx = canvas.getContext("2d");
                    for (let i = 0; i < itemLength; i++) {
                        ctx.fillStyle = (i % 2) === 1 ? config.colors[0] : config.colors[1];
                        ctx.fillRect(0, i * 32, 804, 32);
                    }
                    Object.assign(ctx, config.ctx);
                    for (let i = 0; i < itemLength; i++) {
                        const item = data.list[i];
                        const yPos = ((i + 1) * 24) + (i * 8);
                        ctx.fillStyle = item.hexColor;
                        ctx.fillText(item.name, config.startText, yPos);
                        ctx.fillStyle = "white";
                        ctx.fillText(item.price.toString(), config.startPrice, yPos);
                    }
                    streamResult(canvas);
                }
            }
        }
    });
}

function streamResult(canvas) {
    const stream = canvas.createPNGStream();
    stream.on("data", chunk => {
        s.write(chunk);
    });
    stream.on("end", () => {
        s.end();
    });
}
eventLoop();