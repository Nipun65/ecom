const fs = require('fs');
const requestHandler = (req, res) => {
  const url = req.url;
  const method = req.method;
  if (url === '/') {
    res.write('<html>');
    res.write('<head><title>Enter message</title></head>');
    res.write(
      '<body><form action="/message" method="POST"><input type="text" name="message" /> <button type="submit">Send</button></form></body>'
    );
    res.write('</html>');
    return res.end();
  }

  if (method === 'POST' && url === '/message') {
    const body = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    });
    return req.on('end', () => {
      const parsedBody = Buffer.concat(body).toString();
      fs.writeFile('userInput.txt', parsedBody.split('=')[1], (err) => {
        res.statusCode = 302;
        res.setHeader('Location', '/');
        return res.end();
      });
    });
    // res.setHeader('content-type', 'text/html');
    // res.write('<html><div>Hello from node js server</div></html>');
    // res.end();
  }
};

exports.handler = requestHandler;
exports.someText = 'Some hard coded';
