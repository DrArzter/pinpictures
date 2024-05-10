const mysql = require('mysql');
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');

const app = express();
const uploadPost = multer({ dest: 'uploads/posts' });
const uploadUser = multer({ dest: 'uploads/users' });
const jwtSecretKey = 'mysecretkey';

app.use('/uploads/posts', express.static('uploads/posts'));
app.use('/uploads/users', express.static('uploads/users'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'PrinzEugen1410@',
  database: 'my_db'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL database as id ' + connection.threadId);
});

app.post('/api/users', (req, res) => {
  const { type, ...data } = req.body;

  if (type === 'register') {
    registerUser(req, res, data.name, data.password, data.email);
  } else if (type === 'login') {
    loginUser(req, res, data.name, data.password);
  } else {
    res.status(400).json({ status: 'error', message: 'Invalid request type' });
  }
});

app.post('/api/formdata/posts', uploadPost.single('image'), (req, res) => {
  const formData = req.body;
  const image = req.file;
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }

  try {
    const { id } = jwt.verify(token, jwtSecretKey);
    formData.authorid = id;
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }

  if (formData && image) {
    createPost(req, res, formData.name, formData.description, formData.cost, formData.authorid, image.filename);
  } else {
    res.status(400).json({ status: 'error', message: 'Invalid request data' });
  }
});

app.post('/api/posts', (req, res) => {
  const { type, ...data } = req.body;
  console.log(req.body);
  if (type === 'update') {
    updatePost(req, res, data.id, data.title, data.content);
  } else if (type === 'delete') {
    deletePost(req, res, data.id);
  } else if (type === 'checkout') {
    checkoutPost(req, res, data);
  }
});

app.patch('/api/posts/', (req, res) => {
  const { type, ...data } = req.body;

  if (type === 'updateRating') {
    updateRating(req, res, data.id, data.rating);
  } else {
    res.status(400).json({ status: 'error', message: 'Invalid request type' });
  }
});

app.get('/api/posts/', (req, res) => {
  const sql = `
    SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.cost, 
        p.rating, 
        p.picpath, 
        u.name AS author, 
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', c.id,
                    'author', u.name,
                    'content', c.content
                )
            ) 
            FROM comments c 
            JOIN users u ON c.authorid = u.id
            WHERE c.postid = p.id
        ) AS comments
    FROM 
        posts p 
    JOIN 
        users u ON p.authorid = u.id 
    ORDER BY 
        p.id DESC;`;
        
  connection.query(sql, (err, result) => {
    if (err) {
      console.error('Error selecting data from MySQL database: ' + err.stack);
      res.status(500).json({ status: 'error', message: 'Failed to fetch posts' });
    }
    res.status(200).json({ status: 'success', data: result });
  })
})

app.get('/api/users', (req, res) => {
  const token = req.headers.authorization;
  if (token) {
    try {
      const { id } = jwt.verify(token, jwtSecretKey);
      const sql = 'SELECT * FROM users WHERE id = ?';
      connection.query(sql, [id], (err, result) => {
        if (err) {
          console.error('Error selecting data from MySQL database: ' + err.stack);
          res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
        }
        res.status(200).json({ status: 'success', data: result });
      });
    } catch (error) {
      console.error('Error verifying JWT token: ' + error.message);
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
  } else {
    res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
});

function deletePost(req, res, id) {
  const sql = 'DELETE FROM posts WHERE id = ?';
  connection.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting data from MySQL database: ' + err.stack);
      return res.status(500).json({ status: 'error', message: 'Failed to delete post' });
    }
    res.status(200).json({ status: 'success', message: 'Post deleted successfully' });
  });
}

function checkoutPost(req, res, data) {
  console.log(data);
  const ids = data.items.map(item => item.id);
  const sql = 'DELETE FROM posts WHERE id = ?';

  ids.forEach(id => {
    connection.query(sql, [id], (err, result) => {
      if (err) {
        console.error('Error deleting data from MySQL database: ' + err.stack);
        return res.status(500).json({ status: 'error', message: 'Failed to delete post' });
      }
      console.log(`Post with id ${id} deleted successfully`);
    });
  });

  res.status(200).json({ status: 'success', message: 'Posts deleted successfully' });
}


function updateRating(req, res, id, rating) {
  const sql = 'UPDATE posts SET rating = ? WHERE id = ?';
  connection.query(sql, [rating, id], (err, result) => {
    if (err) {
      console.error('Error updating data in MySQL database: ' + err.stack);
      res.status(500).json({ status: 'error', message: 'Failed to update post rating' });
    }
    const sql = 'SELECT * FROM posts WHERE id = ?';
    connection.query(sql, [id], (err, postResult) => {
      if (err) {
        console.error('Error selecting data from MySQL database: ' + err.stack);
        res.status(500).json({ status: 'error', message: 'Failed to update post rating' });
      }
      res.status(200).json({ status: 'success', message: 'Post rating updated successfully', data: postResult });
    });
  });
}

function createPost(req, res, name, description, cost, authorId) {

  // Создаем пост без указания picpath
  const sql = 'INSERT INTO posts (name, description, cost, authorid) VALUES (?, ?, ?, ?)';
  connection.query(sql, [name, description, cost, authorId], (err, result) => {
    if (err) {
      console.error('Error inserting data into MySQL database: ' + err.stack);
      return res.status(500).json({ status: 'error', message: 'Failed to create post' });
    }

    // Получаем идентификатор созданного поста
    const postId = result.insertId;

    // Определяем путь к файлу
    const file = req.file;
    if (!file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }
    if (!file.mimetype.startsWith('image')) {
      return res.status(400).json({ status: 'error', message: 'Uploaded file is not an image' });
    }
    const fileExtension = file.mimetype.split('/')[1];
    const fileName = postId + '.' + fileExtension;
    const filePath = 'uploads/posts/' + fileName;

    // Переименовываем и перемещаем файл в нужную папку
    fs.renameSync(file.path, filePath);

    // Обновляем запись поста с указанием picpath
    const updateSql = 'UPDATE posts SET picpath = ? WHERE id = ?';
    connection.query(updateSql, [filePath, postId], (updateErr, updateResult) => {
      if (updateErr) {
        console.error('Error updating data in MySQL database: ' + updateErr.stack);
        return res.status(500).json({ status: 'error', message: 'Failed to update post' });
      }
      res.status(201).json({ status: 'success', message: 'Post created successfully', postId });
    });
  });
}


function registerUser(req, res, name, password, email) {
  picpath = "uploads/users/default.png";
  const sql = 'INSERT INTO users (name, email, password, picpath) VALUES (?, ?, ?, ?)';
  connection.query(sql, [name, email, password, picpath], (err, result) => {
    if (err) {
      console.error('Error inserting data into MySQL database: ' + err.stack);
      return res.status(500).json({ status: 'error', message: 'Failed to register user' });
    }

    const userId = result.insertId;
    const sqlSelect = 'SELECT * FROM users WHERE id = ?';
    connection.query(sqlSelect, [userId], (err, userResult) => {
      if (err) {
        console.error('Error selecting data from MySQL database: ' + err.stack);
        return res.status(500).json({ status: 'error', message: 'Failed to register user' });
      }

      const token = jwt.sign({ id: userResult[0].id, name: userResult[0].name, email: userResult[0].email }, jwtSecretKey);
      res.status(201).json({ status: 'success', message: 'User registered successfully', token });
    });
  });
}

function loginUser(req, res, name, password) {
  const sql = 'SELECT * FROM users WHERE name = ? AND password = ?';
  connection.query(sql, [name, password], (err, result) => {
    if (err) {
      console.error('Error selecting data from MySQL database: ' + err.stack);
      return res.status(500).json({ status: 'error', message: 'Failed to login user' });
    }
    if (result.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: result[0].id, name, email: result[0].email }, jwtSecretKey);
    res.status(200).json({ status: 'success', message: 'User logged in successfully', token });
  });
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
