// app.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const arquivo = path.join(__dirname, 'alunos.json');

let alunos = [];
if (fs.existsSync(arquivo)) {
    const data = fs.readFileSync(arquivo, 'utf-8');
    alunos = JSON.parse(data || '[]');
}

let idCounter = alunos.length ? Math.max(...alunos.map(a => a.id)) + 1 : 1;

function salvarDados() {
    fs.writeFileSync(arquivo, JSON.stringify(alunos, null, 2));
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}'));
            } catch (err) {
                reject(err);
            }
        });
    });
}

function responder(res, status, obj) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    // GET /alunos
    if (req.method === 'GET' && pathParts.length === 1 && pathParts[0] === 'alunos') {
        return responder(res, 200, alunos);
    }

    // GET /alunos/:id
    if (req.method === 'GET' && pathParts.length === 2 && pathParts[0] === 'alunos') {
        const aluno = alunos.find(a => a.id === Number(pathParts[1]));
        if (!aluno) return responder(res, 404, { erro: 'Aluno não encontrado' });
        return responder(res, 200, aluno);
    }

    // GET /alunos/media/:id
    if (req.method === 'GET' && pathParts.length === 3 && pathParts[0] === 'alunos' && pathParts[1] === 'media') {
        const aluno = alunos.find(a => a.id === Number(pathParts[2]));
        if (!aluno) return responder(res, 404, { erro: 'Aluno não encontrado' });
        const media = ((aluno.nota1 + aluno.nota2 + aluno.nota3) / 3).toFixed(2);
        const situacao = media >= 7 ? 'Aprovado' : 'Reprovado';
        return responder(res, 200, { ...aluno, media: Number(media), situacao });
    }

    // POST /alunos
    if (req.method === 'POST' && pathParts.length === 1 && pathParts[0] === 'alunos') {
        try {
            const body = await parseBody(req);
            const { nome, nota1, nota2, nota3 } = body;
            if (!nome || nota1 == null || nota2 == null || nota3 == null)
                return responder(res, 400, { erro: 'Campos obrigatórios: nome, nota1, nota2, nota3' });

            const aluno = { id: idCounter++, nome, nota1, nota2, nota3 };
            alunos.push(aluno);
            salvarDados();
            return responder(res, 201, aluno);
        } catch {
            return responder(res, 400, { erro: 'JSON inválido' });
        }
    }

    // PUT /alunos/:id
    if (req.method === 'PUT' && pathParts.length === 2 && pathParts[0] === 'alunos') {
        const aluno = alunos.find(a => a.id === Number(pathParts[1]));
        if (!aluno) return responder(res, 404, { erro: 'Aluno não encontrado' });
        try {
            const body = await parseBody(req);
            const { nome, nota1, nota2, nota3 } = body;
            if (nome) aluno.nome = nome;
            if (nota1 != null) aluno.nota1 = nota1;
            if (nota2 != null) aluno.nota2 = nota2;
            if (nota3 != null) aluno.nota3 = nota3;
            salvarDados();
            return responder(res, 200, aluno);
        } catch {
            return responder(res, 400, { erro: 'JSON inválido' });
        }
    }

    responder(res, 404, { erro: 'Rota não encontrada' });
});

server.listen(3000, () => console.log('API rodando na porta 3000'));
