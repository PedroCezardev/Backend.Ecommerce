const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt")
const { serverConfig } = require("./config");

const Product = require("./src/models/Product");
const User = require("./src/models/User");
const { log } = require("console");

app.use(express.json());
app.use(cors());


app.get("/ping", (req, res) => {
  res.send("pong");
});

//método para adicionar arquivo de imagem na pasta images
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
  }
});

const upload = multer({storage: storage}).fields([
  { name: 'product', maxCount: 50 }, // Substitua 'product' pelo nome do campo que você espera
  { name: 'anotherField', maxCount: 10 } // Adicione mais campos conforme necessário
]);

app.use('/images', express.static('upload/images'))

// método 
app.post("/upload", upload, (req, res) => {
  if (req.files && req.files.product) {
    const files = req.files.product.map(file => ({
      success: 1,
      image_url: `http://${serverConfig.hostname}:${serverConfig.port}/images/${file.filename}`
    }));

    res.json({
      success: 1,
      image_url: files[0].image_url
    });
  } else {
    res.json({
      success: 0,
      message: 'Nenhum arquivo enviado.'
    });
  }
});

app.post('/addproduct', async (req, res) => {
  console.log("Dados do produto recebido: ", req.body);

  let products = await Product.find({});
  let id;

  if (products.length > 0) {
    let last_product_array = products.slice(-1);
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

  console.log("Produto a ser salvo:", product);

  try {
    await product.save();
    console.log("Produto salvo com sucesso.");
    res.json({
      success: true,
      name: req.body.name,
    });
  } catch (error) {
    console.error("Erro ao salvar produto:", error);
    res.status(500).json({ success: false, message: "Erro ao salvar produto." });
  }
});

app.post('/removeproduct', async (req, res) => {
  await Product.findOneAndDelete({id: req.body.id});
  console.log("Removido");
  res.json({
    success: true,
    name: req.body.name,
  })
})

app.get('/allproducts', async (req, res) => {
  let products = await Product.find({});
  console.log("Todos produtos buscados")
  res.send(products);
})

app.post('/signup', async (req, res) => {
  let check = await User.findOne({email:req.body.email});
  if (check) {
    return res.status(400).json(
      {
        success:false, 
        errors: "usuário existente encontrado com o mesmo endereço de e-mail"
      }
    );
  }

  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }

  const {password} = req.body;
  const saltRounds = 10;

  const hashedPassword = await bcrypt.hash(password, saltRounds)


  const user = new User({
    name: req.body.username,
    email: req.body.email,
    password: hashedPassword,
    cartData: cart,
  })

  await user.save();

  const data = {
    user: {
      id: user.id
    }
  }

  const token = jwt.sign(data, 'secret_ecom');
  res.json({success: true, token})
})

app.post('/login', async (req, res) => {
  let user = await User.findOne({email:req.body.email});

  if (user) {
    const passCompare =  bcrypt.compare(req.body.password === user.password);
    if (passCompare) {
      const data = {
        user: {
          id: user.id
        }
      }
      const token = jwt.sign(data, 'secret_ecom')
      res.json({success: true, token})
    } else {
      res.json({success: false, errors: "Senha Incorreta"});
    }
  } else {
    res.json({success: false, errors: "E-mail não cadastrado"})
  }
})

// criando endpoint para dados das novas coleções
app.get('/newcollections', async (req, res) => {
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  console.log("Novas coleções Buscadas")
  res.send(newcollection);
})

// criando endpoint para dados da sessão para mulheres
app.get('/popularInWomen', async (req, res) => {
  let products = await Product.find({category:"women"});
  let popular_in_women = products.slice(0,4);
  console.log("Popular em mulheres buscado");
  res.send(popular_in_women);
})

// criando middelware para buscar o usuário
  const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
      res.status(401).send({errors: "Por favor, autentique usando token válido"})
    } else {
      try {
        const data = jwt.verify(token, 'secret_ecom');
        req.user = data.user;
        next();
      } catch (error) {
        res.status(401).end({errors: "Por favor, autentique usando token válido"})
      }
    }
  }

// criando endpoint para adicionar produtos ao carrinho 
app.post('/addtocart', fetchUser,async (req, res) => {
  console.log("adicionado", req.body.itemId);
  
  let userData = await User.findOne({_id: req.user.id});
  userData.cartData[req.body.itemId] += 1;

  await User.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData});
  res.send("Adicionado");

})

// criadno endpoint para remover o produto do carrinho
app.post('/removeItemCart', fetchUser, async (req, res) => {
  console.log("removido", req.body.itemId);

  let userData = await User.findOne({_id: req.user.id});
  if( userData.cartData[req.body.itemId] > 0 )

  userData.cartData[req.body.itemId] -= 1;

  await User.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData});
  res.send("Removido");
})

// criando endpoint para buscar carrinho
app.post('/getcart', fetchUser, async ( req, res) => {
  console.log("Carrinho buscado");

  let userData = await User.findOne({_id: req.user.id});
  res.json(userData.cartData);
})

app.listen(serverConfig.port, (error) => {
  if (!error) {
    console.log("Servidor Rodando na Porta " + serverConfig.port)
  } else {
    console.log("Error : " + error)
  }
})