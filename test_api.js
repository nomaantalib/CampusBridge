const http = require('http');

const runTest = () => {
    const data = JSON.stringify({
        name: 'Test',
        email: `t${Math.random().toString().slice(2)}@test.com`,
        password: 'password123',
        phoneNumber: '+1' + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        collegeName: 'Test College'
    });

    const req = http.request('http://127.0.0.1:5000/api/auth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => console.log('SIGNUP RES:', res.statusCode, body));
    });

    req.on('error', e => console.error(e));
    req.write(data);
    req.end();
};

runTest();
