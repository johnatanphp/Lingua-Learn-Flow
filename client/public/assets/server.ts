import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('lingua_learn.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT,
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    last_activity DATE
  );

  CREATE TABLE IF NOT EXISTS levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    order_index INTEGER
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level_id INTEGER,
    title TEXT,
    content TEXT,
    order_index INTEGER,
    FOREIGN KEY(level_id) REFERENCES levels(id)
  );

  CREATE TABLE IF NOT EXISTS user_progress (
    user_id INTEGER,
    lesson_id INTEGER,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    score INTEGER,
    reading_score INTEGER DEFAULT 0,
    writing_score INTEGER DEFAULT 0,
    listening_score INTEGER DEFAULT 0,
    speaking_score INTEGER DEFAULT 0,
    PRIMARY KEY(user_id, lesson_id)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    icon TEXT,
    requirement_type TEXT,
    requirement_value INTEGER
  );

  CREATE TABLE IF NOT EXISTS user_achievements (
    user_id INTEGER,
    achievement_id INTEGER,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, achievement_id)
  );

  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professor_id INTEGER,
    title TEXT,
    description TEXT,
    scheduled_at DATETIME,
    duration_minutes INTEGER,
    student_limit INTEGER,
    meeting_link TEXT,
    FOREIGN KEY(professor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tutors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    location TEXT,
    rating REAL,
    classes_count INTEGER,
    price_per_hour INTEGER,
    bio TEXT,
    languages TEXT, -- JSON array
    specialties TEXT, -- JSON array
    available BOOLEAN DEFAULT 1,
    avatar TEXT
  );

  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price INTEGER,
    period TEXT, -- monthly, quarterly, yearly
    features TEXT, -- JSON array
    is_popular BOOLEAN DEFAULT 0,
    tag TEXT
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY,
    theme TEXT DEFAULT 'light',
    learning_language TEXT DEFAULT 'English',
    notifications BOOLEAN DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT,
    message TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS internal_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  );
`);

// Seed data if empty
const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)').run(
    'fundacionstudy@gmail.com',
    'Marzo2026.',
    'admin',
    'Admin User'
  );
  db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)').run(
    'john474nvallejo@gmail.com',
    'student123',
    'student',
    'Johnatan vallejo'
  );

  // Seed Tutors
  const tutors = [
    { name: 'María González', location: 'Medellín', rating: 4.9, classes: 320, price: 80000, bio: 'Profesora certificada con 8 años de experiencia. Especialista en inglés para negocios.', languages: '["Inglés"]', specialties: '["Negocios", "Gramática", "Conversación"]', avatar: 'https://picsum.photos/seed/maria/200' },
    { name: 'Carlos Restrepo', location: 'Bogotá', rating: 4.8, classes: 510, price: 110000, bio: 'Nativo bilingüe, tutor certificado IELTS. Clases dinámicas y personalizadas.', languages: '["Inglés", "Francés"]', specialties: '["IELTS", "Pronunciación", "Cultura"]', avatar: 'https://picsum.photos/seed/carlos/200' },
    { name: 'Ana Martínez', location: 'Cali', rating: 5.0, classes: 680, price: 95000, bio: 'Lingüista con maestría en enseñanza de lenguas. Experta en todos los niveles.', languages: '["Inglés", "Alemán"]', specialties: '["TOEFL", "Escritura académica", "Pronunciación"]', avatar: 'https://picsum.photos/seed/ana/200' }
  ];
  for (const t of tutors) {
    db.prepare('INSERT INTO tutors (name, location, rating, classes_count, price_per_hour, bio, languages, specialties, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      t.name, t.location, t.rating, t.classes, t.price, t.bio, t.languages, t.specialties, t.avatar
    );
  }

  // Seed Plans
  const plans = [
    { name: 'Gratis', price: 0, period: 'mensual', features: '["5 lecciones por mes", "Conversación IA (3 sesiones)", "Pronunciación básica", "Nivel A1 y A2"]', is_popular: 0, tag: '' },
    { name: 'Básico', price: 49900, period: 'mensual', features: '["30 lecciones por mes", "Conversación IA ilimitada", "Análisis de pronunciación IA", "Todos los niveles A1–B2", "1 clase en vivo / mes"]', is_popular: 0, tag: '' },
    { name: 'Pro', price: 89900, period: 'mensual', features: '["Lecciones ilimitadas", "Conversación IA ilimitada", "Pronunciación avanzada con IA", "Todos los niveles A1–C2", "4 clases en vivo / mes", "Progreso con tutores", "Certificado de nivel"]', is_popular: 1, tag: 'Más popular' },
    { name: 'Academia', price: 189900, period: 'mensual', features: '["Todo lo de Pro", "Clases en vivo ilimitadas", "Tutor personal asignado", "Grupos de estudio", "Acceso para 3 usuarios", "Reportes de progreso para padres", "Soporte prioritario WhatsApp"]', is_popular: 0, tag: 'Familias' }
  ];
  for (const p of plans) {
    db.prepare('INSERT INTO plans (name, price, period, features, is_popular, tag) VALUES (?, ?, ?, ?, ?, ?)').run(
      p.name, p.price, p.period, p.features, p.is_popular, p.tag
    );
  }
  db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)').run(
    'dev@example.com',
    'dev123',
    'developer',
    'Dev Alex'
  );
  db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)').run(
    'student@example.com',
    'student123',
    'student',
    'John Doe'
  );

  // Seed levels
  const levels = [
    { name: 'A1 - Beginner', description: 'Basic communication and vocabulary', order: 1 },
    { name: 'A2 - Elementary', description: 'Simple tasks and direct exchange', order: 2 },
    { name: 'B1 - Intermediate', description: 'Main points of clear standard input', order: 3 }
  ];

  for (const level of levels) {
    const result = db.prepare('INSERT INTO levels (name, description, order_index) VALUES (?, ?, ?)').run(
      level.name, level.description, level.order
    );
    const levelId = result.lastInsertRowid;

    // Seed lessons for each level
    db.prepare('INSERT INTO lessons (level_id, title, content, order_index) VALUES (?, ?, ?, ?)').run(
      levelId, 'Greetings', 'Learn how to say hello and goodbye.', 1
    );
    db.prepare('INSERT INTO lessons (level_id, title, content, order_index) VALUES (?, ?, ?, ?)').run(
      levelId, 'Numbers', 'Counting from 1 to 100.', 2
    );
  }

  // Seed achievements
  const achievements = [
    { name: 'Primer Paso', description: 'Completa tu primera lección', icon: 'Star', type: 'lessons', value: 1 },
    { name: 'Estudiante Dedicado', description: 'Alcanza una racha de 3 días', icon: 'Zap', type: 'streak', value: 3 },
    { name: 'Maestro del Diálogo', description: 'Habla 10 veces con el tutor IA', icon: 'MessageSquare', type: 'ai_chats', value: 10 },
    { name: 'Políglota en Ciernes', description: 'Completa el nivel A1', icon: 'Trophy', type: 'level', value: 1 }
  ];
  for (const ach of achievements) {
    db.prepare('INSERT INTO achievements (name, description, icon, requirement_type, requirement_value) VALUES (?, ?, ?, ?, ?)').run(
      ach.name, ach.description, ach.icon, ach.type, ach.value
    );
  }

  // Seed classes
  db.prepare('INSERT INTO classes (professor_id, title, description, scheduled_at, duration_minutes, student_limit, meeting_link) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    2, 'Inglés Conversacional B1', 'Práctica de speaking para nivel intermedio', '2026-03-06 10:00:00', 90, 12, 'https://jitsi.example.com/speak-fluently-b1'
  );
  db.prepare('INSERT INTO classes (professor_id, title, description, scheduled_at, duration_minutes, student_limit, meeting_link) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    2, 'Gramática Avanzada C1', 'Uso de tiempos verbales complejos', '2026-03-06 14:00:00', 60, 15, 'https://jitsi.example.com/speak-fluently-c1'
  );

  // Seed logs
  db.prepare('INSERT INTO system_logs (level, message, details) VALUES (?, ?, ?)').run('INFO', 'System startup completed', 'All modules initialized');
  db.prepare('INSERT INTO system_logs (level, message, details) VALUES (?, ?, ?)').run('WARN', 'Gemini API latency spike', 'Latency reached 850ms');
  db.prepare('INSERT INTO system_logs (level, message, details) VALUES (?, ?, ?)').run('INFO', 'New user registered', 'student@example.com');
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  // WebSocket Chat Logic
  const clients = new Map<number, WebSocket>();

  wss.on('connection', (ws, req) => {
    let userId: number | null = null;

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'AUTH') {
        userId = message.userId;
        if (userId) clients.set(userId, ws);
        console.log(`User ${userId} connected to chat`);
      }

      if (message.type === 'CHAT_MESSAGE') {
        const { senderId, receiverId, text } = message;
        db.prepare('INSERT INTO internal_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)').run(senderId, receiverId, text);
        
        const receiverWs = clients.get(receiverId);
        if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
          receiverWs.send(JSON.stringify({
            type: 'NEW_MESSAGE',
            senderId,
            text,
            timestamp: new Date().toISOString()
          }));
        }
      }
    });

    ws.on('close', () => {
      if (userId) clients.delete(userId);
    });
  });

  // API Routes
  app.post('/api/register', (req, res) => {
    const { email, password, name, role = 'student' } = req.body;
    try {
      const result = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(email, password, name, role);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as any;
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: 'Failed to register' });
      }
    }
  });

  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password) as any;
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.get('/api/levels', (req, res) => {
    const levels = db.prepare('SELECT * FROM levels ORDER BY order_index').all();
    res.json(levels);
  });

  app.get('/api/lessons/:levelId', (req, res) => {
    const lessons = db.prepare('SELECT * FROM lessons WHERE level_id = ? ORDER BY order_index').all(req.params.levelId);
    res.json(lessons);
  });

  app.get('/api/user/:userId/progress', (req, res) => {
    const progress = db.prepare('SELECT * FROM user_progress WHERE user_id = ?').all(req.params.userId);
    res.json(progress);
  });

  // Chat Endpoints
  app.get('/api/chat/history/:userId/:otherId', (req, res) => {
    const { userId, otherId } = req.params;
    const messages = db.prepare(`
      SELECT * FROM internal_messages 
      WHERE (sender_id = ? AND receiver_id = ?) 
      OR (sender_id = ? AND receiver_id = ?)
      ORDER BY timestamp ASC
    `).all(userId, otherId, otherId, userId);
    res.json(messages);
  });

  // Admin Endpoints
  app.get('/api/admin/users', (req, res) => {
    const users = db.prepare('SELECT id, email, name, role, xp, streak FROM users').all();
    res.json(users);
  });

  app.get('/api/admin/stats', (req, res) => {
    const totalUsers = db.prepare('SELECT count(*) as count FROM users').get() as any;
    const totalLessons = db.prepare('SELECT count(*) as count FROM lessons').get() as any;
    const totalProgress = db.prepare('SELECT count(*) as count FROM user_progress').get() as any;
    const totalRevenue = 12500000; // Mock revenue for Wompi demo
    res.json({
      users: totalUsers.count,
      lessons: totalLessons.count,
      completions: totalProgress.count,
      revenue: totalRevenue
    });
  });

  app.get('/api/admin/payments', (req, res) => {
    const payments = [
      { id: 'TXN_001', user: 'John Doe', amount: 45000, status: 'APPROVED', date: '2026-03-05', method: 'CREDIT_CARD' },
      { id: 'TXN_002', user: 'Jane Smith', amount: 45000, status: 'APPROVED', date: '2026-03-04', method: 'PSE' },
      { id: 'TXN_003', user: 'Bob Wilson', amount: 45000, status: 'PENDING', date: '2026-03-05', method: 'BANCOLOMBIA' },
      { id: 'TXN_004', user: 'Alice Brown', amount: 45000, status: 'DECLINED', date: '2026-03-03', method: 'CREDIT_CARD' },
    ];
    res.json(payments);
  });

  // Wompi Mock Integration
  app.post('/api/payments/wompi/checkout', (req, res) => {
    const { amount, planId, userId } = req.body;
    // Mock Wompi session creation
    res.json({
      checkoutUrl: `https://checkout.wompi.co/p/mock_session_${Date.now()}`,
      transactionId: `MOCK_TX_${Math.random().toString(36).substr(2, 9)}`
    });
  });

  // Google Drive Mock Integration
  app.get('/api/drive/files', (req, res) => {
    const files = [
      { id: '1', name: 'Lección_1_Gramática.pdf', type: 'application/pdf', size: '1.2MB' },
      { id: '2', name: 'Audio_Práctica_A1.mp3', type: 'audio/mpeg', size: '4.5MB' },
      { id: '3', name: 'Vocabulario_Negocios.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: '800KB' },
    ];
    res.json(files);
  });

  app.post('/api/admin/levels', (req, res) => {
    const { name, description, order_index } = req.body;
    const result = db.prepare('INSERT INTO levels (name, description, order_index) VALUES (?, ?, ?)').run(name, description, order_index);
    res.json({ id: result.lastInsertRowid });
  });

  app.post('/api/admin/lessons', (req, res) => {
    const { level_id, title, content, order_index } = req.body;
    const result = db.prepare('INSERT INTO lessons (level_id, title, content, order_index) VALUES (?, ?, ?, ?)').run(level_id, title, content, order_index);
    res.json({ id: result.lastInsertRowid });
  });

  app.get('/api/user/:userId/achievements', (req, res) => {
    const achievements = db.prepare(`
      SELECT a.*, ua.unlocked_at 
      FROM achievements a 
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
    `).all(req.params.userId);
    res.json(achievements);
  });

  app.get('/api/user/:userId/skills', (req, res) => {
    const skills = db.prepare(`
      SELECT 
        AVG(reading_score) as reading,
        AVG(writing_score) as writing,
        AVG(listening_score) as listening,
        AVG(speaking_score) as speaking
      FROM user_progress 
      WHERE user_id = ?
    `).get(req.params.userId);
    res.json(skills);
  });

  app.post('/api/user/:userId/complete-lesson', (req, res) => {
    const { userId } = req.params;
    const { lessonId, score, xpGained, reading, writing, listening, speaking } = req.body;
    
    try {
      db.prepare(`
        INSERT OR REPLACE INTO user_progress 
        (user_id, lesson_id, score, reading_score, writing_score, listening_score, speaking_score) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(userId, lessonId, score, reading || 0, writing || 0, listening || 0, speaking || 0);
      
      db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(xpGained, userId);
      
      const totalCompleted = db.prepare('SELECT count(*) as count FROM user_progress WHERE user_id = ?').get(userId) as any;
      if (totalCompleted.count === 1) {
        db.prepare('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, 1)').run(userId);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update progress' });
    }
  });

  // Professor Endpoints
  app.get('/api/professor/students', (req, res) => {
    const students = db.prepare('SELECT id, email, name, xp, streak FROM users WHERE role = "student"').all();
    res.json(students);
  });

  app.get('/api/professor/classes/:professorId', (req, res) => {
    const classes = db.prepare('SELECT * FROM classes WHERE professor_id = ? ORDER BY scheduled_at').all(req.params.professorId);
    res.json(classes);
  });

  app.post('/api/professor/classes', (req, res) => {
    const { professor_id, title, description, scheduled_at, duration_minutes, student_limit, meeting_link } = req.body;
    const result = db.prepare(`
      INSERT INTO classes (professor_id, title, description, scheduled_at, duration_minutes, student_limit, meeting_link) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(professor_id, title, description, scheduled_at, duration_minutes, student_limit, meeting_link);
    res.json({ id: result.lastInsertRowid });
  });

  app.get('/api/tutors', (req, res) => {
    const tutors = db.prepare('SELECT * FROM tutors').all();
    res.json(tutors);
  });

  app.get('/api/plans', (req, res) => {
    const plans = db.prepare('SELECT * FROM plans').all();
    res.json(plans);
  });

  app.get('/api/user/:userId/settings', (req, res) => {
    let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.params.userId);
    if (!settings) {
      db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(req.params.userId);
      settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.params.userId);
    }
    res.json(settings);
  });

  app.post('/api/user/:userId/settings', (req, res) => {
    const { theme, learning_language, notifications } = req.body;
    db.prepare(`
      UPDATE user_settings 
      SET theme = ?, learning_language = ?, notifications = ? 
      WHERE user_id = ?
    `).run(theme, learning_language, notifications ? 1 : 0, req.params.userId);
    res.json({ success: true });
  });

  // Developer Endpoints
  app.get('/api/dev/logs', (req, res) => {
    const logs = db.prepare('SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 50').all();
    res.json(logs);
  });

  app.get('/api/dev/status', (req, res) => {
    res.json({
      api: 'ONLINE',
      database: 'CONNECTED',
      gemini: 'READY',
      wompi: 'TEST_MODE',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  });

  app.get('/api/dev/db-stats', (req, res) => {
    const tables = ['users', 'levels', 'lessons', 'user_progress', 'achievements', 'classes', 'system_logs', 'internal_messages'];
    const stats = tables.map(table => {
      const count = db.prepare(`SELECT count(*) as count FROM ${table}`).get() as any;
      return { table, count: count.count };
    });
    res.json(stats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
