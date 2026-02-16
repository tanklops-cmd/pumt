import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';

const router = Router();

const users: Array<{
  id: string;
  username: string;
  password: string;
  role: string;
  unitId?: string;
}> = [
  {
    id: '1',
    username: 'admin',
    password: bcrypt.hashSync('admin2024', 10),
    role: 'admin',
  },
  {
    id: '2',
    username: 'officer',
    password: bcrypt.hashSync('officer2024', 10),
    role: 'staff',
    unitId: 'north',
  },
];

router.post('/login', async (req, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }

    const user = users.find((u) => u.username === username);

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      id: user.id,
      role: user.role,
      unitId: user.unitId,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        unitId: user.unitId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/register', async (req, res: Response) => {
  try {
    const { username, password, role, unitId } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }

    const existingUser = users.find((u) => u.username === username);
    if (existingUser) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: String(users.length + 1),
      username,
      password: hashedPassword,
      role: role || 'staff',
      unitId,
    };

    users.push(newUser);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7);
  
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = users.find((u) => u.id === decoded.id);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      unitId: user.unitId,
    });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
