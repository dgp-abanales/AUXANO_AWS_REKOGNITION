import http from 'http';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  try {
    const host = '127.0.0.1';
    const port = 3001;

    const users = await request({ method: 'GET', host, port, path: '/api/users' });
    console.log('--- /api/users', users.status, '---');
    console.log(users.body);

    const verify = await request({ method: 'POST', host, port, path: '/api/verify' });
    console.log('--- /api/verify', verify.status, '---');
    console.log(verify.body);
  } catch (err) {
    console.error('ERR', err.message || err);
  }
})();
