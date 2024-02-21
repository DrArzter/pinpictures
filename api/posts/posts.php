<?php

require '../../vendor/autoload.php';

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
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $page = sanitizeInput($_GET['page'])*20;
    $posts = getPosts($page);
    echo json_encode($posts);
}

function getPosts($page) {
    global $secretKey, $dbip, $dbuser, $dbpassword, $dbname;
    $conn = new mysqli($dbip, $dbuser, $dbpassword, $dbname);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $stmt = $conn->prepare("SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET ?;");
    $stmt->bind_param("n", $page);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->fetch_all(MYSQLI_ASSOC);
}