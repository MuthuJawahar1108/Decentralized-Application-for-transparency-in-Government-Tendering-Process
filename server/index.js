// index.js (CommonJS)
// const express = require('express');
// require('dotenv').config();

// const uploadRouter = require('./routes/uploadRoute.js');

// const app = express();
// const PORT = process.env.PORT || 5001;

// app.use(express.json());
// app.use('/upload', uploadRouter);

// app.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });



// server/index.js (CommonJS)
const express = require('express');
const dotenv = require('dotenv');
const uploadRouter = require('./routes/uploadRoute.js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use('/upload', uploadRouter);

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
