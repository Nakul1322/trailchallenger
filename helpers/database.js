const mongoose = require('mongoose');
require('dotenv').config()

mongoose.connect(process.env.db, { useNewUrlParser: true, useUnifiedTopology: true });

const conSuccess = mongoose.connection
conSuccess.once('open', res => {
  console.log('Database connected:', process.env.db)
})

conSuccess.on('error', err => {
  console.error('connection error:', err)
})

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0)
})