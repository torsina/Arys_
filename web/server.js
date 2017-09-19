const http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");
port = process.argv[2] || 8888;


    http.createServer(function(req, res) {

        var filePath = req.url;
        if (filePath == '/')
            filePath = '/index.html';

        filePath = __dirname+filePath;
        var extname = path.extname(filePath);
        var contentType = 'text/html';

        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
        }


        fs.exists(filePath, function(exists) {

            if (exists) {
                fs.readFile(filePath, function (error, content) {
                    if (error) {
                        res.writeHead(500);
                        res.end();
                    }
                    else {
                        res.writeHead(200, {'Content-Type': contentType});
                        res.end(content, 'utf-8');
                    }
                });
            }
        });
    }).listen(parseInt(port, 10));

    console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
