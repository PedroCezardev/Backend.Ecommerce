const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const { serverConfig } = require("./config");

const Product = require("./src/models/Product");
const User = require("./src/models/User");

app.use(express.json());
app.use(cors());


app.get("/ping", (req, res) => {
  res.send("pong");
});

const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
  }
});

const upload = multer({storage: storage});

app.use('/images', express.static('upload/images'))

app.post("/upload", upload.single('product'), (req, res) => {
  res.json({
    success: 1,
    image_url: `http://${serverConfig.hostname}:${serverConfig.port}/images/${req.file.filename}`
  });
});

app.post('/addproduct', async (req, res) => {
  console.log("Dados do produto recebido: ", req.body);

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

  console.log("Produto a ser salvo:", product);

  await product.save();
  console.log("Saved");

  res.json({
    success: true,
    name: req.body.name,
  });
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

  const user = new User({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
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
    const passCompare = req.body.password === user.password;
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
    res.json({success: false, errors: "ID de e-mail incorreto"})
  }
})

app.listen(serverConfig.port, (error) => {
  if (!error) {
    console.log("Servidor Rodando na Porta " + serverConfig.port)
  } else {
    console.log("Error : " + error)
  }
})