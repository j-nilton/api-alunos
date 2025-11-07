const http = require('http');
const { URL } = require('url');

let alunos = [
    { id: 1, nome: 'Jéferson', notas: [8, 7, 9], situacao: '' },
    { id: 2, nome: 'Maria', notas: [6, 5, 7], situacao: '' },
    { id: 3, nome: 'Carlos', notas: [9, 8, 10], situacao: '' },
    { id: 4, nome: 'João', notas: [4, 6, 5], situacao: '' },
    { id: 5, nome: 'Ana', notas: [7, 7, 8], situacao: '' },
];

function atualizarMediaESituacao(aluno) {
    const media =
        aluno.notas.reduce((acc, n) => acc + n, 0) / aluno.notas.length;
    aluno.media = parseFloat(media.toFixed(2));
    aluno.situacao = media >= 7 ? 'Aprovado' : 'Reprovado';
    return aluno;
}

alunos = alunos.map(atualizarMediaESituacao);

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const path = parsedUrl.pathname;
    const method = req.method;

    const sendJSON = (status, data) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data, null, 2));
    };

    if (method === 'GET' && path === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end('API de Alunos - Servidor Node.js');
    }


    if (method === 'GET' && path === '/alunos') {
        const nomeBusca = parsedUrl.searchParams.get('nome');
        const lista = nomeBusca
            ? alunos.filter(a =>
                a.nome.toLowerCase().includes(nomeBusca.toLowerCase())
            )
            : alunos;
        return sendJSON(200, lista);
    }

    if (method === 'GET' && path === '/alunos/ordenados') {
        const ordenados = [...alunos].sort((a, b) => b.media - a.media);
        return sendJSON(200, ordenados);
    }

    if (method === 'GET' && path === '/alunos/ranking') {
        const ranking = [...alunos].sort((a, b) => b.media - a.media).slice(0, 3);
        return sendJSON(200, ranking);
    }

    if (method === 'GET' && path === '/alunos/aprovados') {
        const aprovados = alunos.filter(a => a.media >= 7);
        return sendJSON(200, aprovados);
    }

    if (method === 'GET' && path === '/alunos/reprovados') {
        const reprovados = alunos.filter(a => a.media < 7);
        return sendJSON(200, reprovados);
    }

    if (method === 'POST' && path === '/alunos') {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
            try {
                const novoAluno = JSON.parse(body);
                if (!novoAluno.nome || !Array.isArray(novoAluno.notas)) {
                    return sendJSON(400, { erro: 'Campos inválidos' });
                }

                novoAluno.id = alunos.length + 1;
                atualizarMediaESituacao(novoAluno);
                alunos.push(novoAluno);

                sendJSON(201, {
                    mensagem: 'Aluno cadastrado com sucesso!',
                    aluno: novoAluno,
                });
            } catch {
                sendJSON(400, { erro: 'Corpo da requisição inválido' });
            }
        });
        return;
    }

    if (method === 'PUT' && path.startsWith('/alunos/recuperacao/')) {
        const id = parseInt(path.split('/')[3]);
        const alunoIndex = alunos.findIndex(a => a.id === id);

        if (alunoIndex === -1) {
            return sendJSON(404, { erro: 'Aluno não encontrado' });
        }

        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
            try {
                const { notas } = JSON.parse(body);
                if (!Array.isArray(notas) || notas.length === 0) {
                    return sendJSON(400, { erro: 'Notas inválidas' });
                }

                alunos[alunoIndex].notas = notas;
                atualizarMediaESituacao(alunos[alunoIndex]);

                sendJSON(200, {
                    mensagem: 'Média e situação atualizadas automaticamente!',
                    aluno: alunos[alunoIndex],
                });
            } catch {
                sendJSON(400, { erro: 'Corpo da requisição inválido' });
            }
        });
        return;
    }

    sendJSON(404, { erro: 'Rota não encontrada' });
});

server.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
