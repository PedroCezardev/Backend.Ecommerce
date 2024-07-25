const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

app.use(express.json());
app.use(cors());

// conexão de banco de dados com mongodb
// Encode a senha para escapar caracteres especiais
const username = 'pedrocezar';
const password = encodeURIComponent('@Pedrdev01');
const cluster = 'ecommerce.0tfzdmn.mongodb.net';
const dbname = 'e-commerce';

const dbUri = `mongodb+srv://${username}:${password}@${cluster}/${dbname}`;

mongoose.connect(dbUri, {
    serverSelectionTimeoutMS: 30000, // 30 segundos
    socketTimeoutMS: 45000 // 45 segundos
})
// verificando a conexão com o banco MongoDB
.then(() => console.log('Conectado ao MongoDB'))
.catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Criação Api
app.get("/", (req, res) => {
    res.send("App Express rodando")
})

// mecanismo de armazenamento de imagens
const storage = multer.diskStorage({
    destination: "./upload/images",
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage: storage})

// Criando Endpoint para Upload de Imagens
app.use('/images', express.static('upload/images'))

app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        sucecess: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    })
})

// esquema para criação de produtos

// método 'Model' para adicionar o as propriedades do objeto Product
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        requeired: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now
    },
    avilable: {
        type: Boolean,
        default: true,
    },
})

// método para adicionar um novo produto
app.post('/addproduct', async (req, res) => {
    let products = await Product.find({});
    let id;

    if(products.length > 0){
        let last_product_array = products.slice( -1 );
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    } else {
        id = 1;
    }

    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    console.log(product);

    await product.save();
    console.log("Saved");

    res.json({
        success: true,
        name: req.body.name,
    });
});

// Criação de método para deletar produtos
app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({id: req.body.id});
    console.log("Removido");
    res.json({
        success: true,
        name: req.body.name,
    })
})

// Criação de método para Buscar todos produtos
app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    console.log("Todos produtos buscados")
    res.send(products);
})

// Verificando se o servidor esta rodando
app.listen(port,(error) => {
    if (!error) {
        console.log("Servidor Rodando na Porta " + port)
    } else {
        console.log("Error : " + error)
    }
})