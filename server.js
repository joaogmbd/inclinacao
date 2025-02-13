const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public')); // Serve arquivos estáticos da pasta "public"

app.get('/', (req, res) => {
    res.render('index', { resultArredondado: null, resultTruncado: null });
});

app.post('/calcular', upload.fields([{ name: 'fileX' }, { name: 'fileY' }]), (req, res) => {
    const fileXPath = req.files['fileX'][0].path;
    const fileYPath = req.files['fileY'][0].path;

    // Ler os arquivos e converter para arrays de números
    const x = fs.readFileSync(fileXPath, 'utf-8').split('\n').filter(Boolean).map(Number);
    const y = fs.readFileSync(fileYPath, 'utf-8').split('\n').filter(Boolean).map(Number);

    // Validar os dados
    if (x.length !== y.length) {
        return res.status(400).send('Os arquivos devem ter o mesmo número de valores.');
    }

    if (x.some(isNaN) || y.some(isNaN)) {
        return res.status(400).send('Os arquivos devem conter apenas números.');
    }

    // Função para calcular a inclinação
    const calcularInclinacao = (x, y) => {
        const n = x.length;
        const somaXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
        const somaX = x.reduce((acc, xi) => acc + xi, 0);
        const somaY = y.reduce((acc, yi) => acc + yi, 0);
        const somaX2 = x.reduce((acc, xi) => acc + xi ** 2, 0);

        const numerador = n * somaXY - somaX * somaY;
        const denominador = n * somaX2 - somaX ** 2;

        if (denominador === 0) throw new Error('Denominador não pode ser zero.');

        return numerador / denominador;
    };

    try {
        const inclinacao = calcularInclinacao(x, y);

        // Arredondado para 2 casas decimais
        const inclinacaoArredondada = parseFloat(inclinacao.toFixed(2));

        // Truncado para 2 casas decimais
        const inclinacaoTruncada = Math.floor(inclinacao * 100) / 100;

        // Envie ambos os resultados para o template
        res.render('index', { 
            resultArredondado: inclinacaoArredondada,
            resultTruncado: inclinacaoTruncada
        });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
