const request = require('supertest');
const app = require('../server');
const path = require('path');

describe('GET /api/produtos', () => {
  it('retorna status 200 e um array', async () => {
    const res = await request(app).get('/api/produtos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/produtos/:id', () => {
  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).get('/api/produtos/nonexistent-id');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/usuarios', () => {
  it('permite nomes com espaço', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/login')
      .send({ usuario: 'start', senha: 'start' })
      .expect(200);

    const res = await agent
      .post('/api/usuarios')
      .field('usuario', 'dev lima')
      .field('senha', '12345')
      .field('admin', 'false');

    expect(res.status).toBe(201);
    expect(res.body.usuario).toBe('dev lima');
    expect(res.body.admin).toBe(false);

    await agent.delete(`/api/usuarios/${res.body.id}`).expect(200);
  });
});

describe('POST /api/logout', () => {
  it('encerra a sessão atual', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/login')
      .send({ usuario: 'start', senha: 'start' })
      .expect(200);

    await agent.post('/api/logout').expect(200);

    const res = await agent.get('/api/session');
    expect(res.body.autenticado).toBe(false);
  });
});

describe('PUT /api/usuarios/me', () => {
  it('permite alterar nome, senha e foto', async () => {
    const agent = request.agent(app);

    await agent
      .post('/api/login')
      .send({ usuario: 'start', senha: 'start' })
      .expect(200);

    await agent
      .put('/api/usuarios/me')
      .field('usuario', 'startx')
      .field('senha', 'startx')
      .attach('foto', path.join(__dirname, '..', 'public', 'images', 'placeholder.png'))
      .expect(200);

    await agent.post('/api/logout').expect(200);

    await agent
      .post('/api/login')
      .send({ usuario: 'startx', senha: 'startx' })
      .expect(200);

    await agent
      .put('/api/usuarios/me')
      .field('usuario', 'start')
      .field('senha', 'start')
      .attach('foto', path.join(__dirname, '..', 'public', 'images', 'placeholder.png'))
      .expect(200);

    await agent.post('/api/logout').expect(200);

    await agent
      .post('/api/login')
      .send({ usuario: 'start', senha: 'start' })
      .expect(200);
  }, 10000);
});
