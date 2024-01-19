const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;
app.use(express.static('public'));

// svyz s mongo
mongoose.connect('mongodb://localhost:27017/userdb', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.once('open', () => {
  console.log('Connected to MongoDB');
});

// user schemany obnaruzhit eted
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: true }));

// Ustanovite mekhanizm prosmotra na ejs
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.render('register', { message: 'User already exists. Choose a different username.' });
    }

    const password = req.body.password;

    // Password validation checks
    if (!password || !validatePassword(password)) {
      return res.render('register', {
        message: 'Password must contain at least 1 uppercase letter, 1 number, and 1 special character.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username: req.body.username, password: hashedPassword });
    await user.save();
    res.redirect('/');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Proverki parolya
function validatePassword(password) {
  console.log('Password:', password);
  
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
  const isValid = passwordRegex.test(password);
  
  return isValid;
}


app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
  
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.render('login', { message: 'Incorrect username or password. Please try again.' });
    }
  
    req.session.userId = user._id;
    res.redirect('/dashboard');
  });
  

app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    res.redirect('/login');
  } else {
    res.render('dashboard');
  }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.redirect('/');
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
  

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
