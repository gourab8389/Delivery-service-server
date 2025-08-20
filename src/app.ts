import express from 'express';
import cors from 'cors';


import dotenv from 'dotenv';
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'User Service' });
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});

export default app;