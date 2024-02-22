<?php

require '../../vendor/autoload.php';

error_reporting(E_ALL);
ini_set('display_errors', 1);

$dotenv = Dotenv\Dotenv::createImmutable("../../");
$dotenv->load();

$secretKey = $_ENV['secretKey'];
$dbip = $_ENV['dbip'];
$dbuser = $_ENV['dbuser'];
$dbpassword = $_ENV['dbpassword'];
$dbname = $_ENV['dbname'];

function sanitizeInput($input) {
    return $input !== null ? htmlspecialchars($input, ENT_QUOTES, 'UTF-8') : '';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $post = json_decode(file_get_contents('php://input'), true);
    $title = sanitizeInput($post['title']);
    $picture = sanitizeInput($post['picture']);
    $status = createPost($title, $picture);
    echo $status;
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $page = (intval(sanitizeInput($_GET['page']))-1)*20;
    $posts = getPosts($page);
    echo json_encode($posts);
    exit;
}

function getPosts($page) {
    global $secretKey, $dbip, $dbuser, $dbpassword, $dbname;
    $conn = new mysqli($dbip, $dbuser, $dbpassword, $dbname);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $stmt = $conn->prepare("SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET ?;");
    $stmt->bind_param("i", $page);
    $stmt->execute();
    $result = $stmt->get_result();
    $posts = $result->fetch_all(MYSQLI_ASSOC);
    return $posts;
}

function createPost($title, $picture) {
    global $secretKey, $dbip, $dbuser, $dbpassword, $dbname;
    $conn = new mysqli($dbip, $dbuser, $dbpassword, $dbname);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    $stmt = $conn->prepare("INSERT INTO posts (title, picPath) VALUES (?, ?)");
    $stmt->bind_param("ss", $title, $picture);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        return json_encode(["status" => "success", "message" => "Post created successfully"]);
    } else {
        return json_encode(["status" => "error", "message" => "Failed to create post"]);
    }
}

