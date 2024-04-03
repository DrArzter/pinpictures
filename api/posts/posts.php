<?php

require '../../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

error_reporting(E_ALL);
ini_set('display_errors', 1);

$dotenv = Dotenv\Dotenv::createImmutable("../../");
$dotenv->load();

$secretKey = $_ENV['secretKey'];
$dbip = $_ENV['dbip'];
$dbuser = $_ENV['dbuser'];
$dbpassword = $_ENV['dbpassword'];
$dbname = $_ENV['dbname'];

function sanitizeInput($input)
{
    return $input !== null ? htmlspecialchars($input, ENT_QUOTES, 'UTF-8') : '';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = isset($_COOKIE['auth_token']) ? sanitizeInput($_COOKIE['auth_token']) : false;
    if ($token) {
        $payload = JWT::decode($token, new Key($secretKey, 'HS256'));
        $id = $payload->sub;
        if (checkToken($id)) {
            $payload = JWT::decode($token, new Key($secretKey, 'HS256'));
            $authorID = $payload->sub;
            $postTitle = sanitizeInput($_POST['title']);
            $postDesctiprion = sanitizeInput($_POST['description']);
            $image = $_FILES['image'];
            createPost($postTitle, $authorID, $postDesctiprion, $image);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $page = (intval(sanitizeInput($_GET['page'])) - 1) * 20;
    $posts = getPosts($page);
    echo json_encode($posts);
    exit;
}

function createPost($title, $authorID, $description, $image)
{
    global $secretKey, $dbip, $dbuser, $dbpassword, $dbname;
    $conn = new mysqli($dbip, $dbuser, $dbpassword, $dbname);

    $permittedFiles = array('png', 'jpg', 'jpeg');
    $ext = pathinfo($image['name'], PATHINFO_EXTENSION);

    if (!in_array($ext, $permittedFiles)) {
        echo json_encode(["status" => "error", "message" => "Invalid file type"]);
    }

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $stmt = $conn->prepare("INSERT INTO posts (authorID, title, description) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $authorID, $title, $description);
    $stmt->execute();
    $id = $stmt->insert_id;
    $image = "$id.png";
    $stmt->close();

    if ($_FILES['image']['error'] == UPLOAD_ERR_OK) {
        move_uploaded_file($_FILES['image']['tmp_name'], "../../storage/imgs/$image");
    } else {
        echo json_encode(["status" => "error", "message" => "File upload failed"]);
        exit;
    }
   
    $stmt = $conn->prepare("UPDATE posts SET picPath = ? WHERE id = ?");
    $stmt->bind_param("si", $image, $id);
    $stmt->execute();
    
    if ($stmt->affected_rows > 0) {
        echo json_encode(["status" => "success", "message" => "Post created successfully"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Unknown error"]);
    }

    $stmt->close();

}

function getPosts($page)
{
    global $secretKey, $dbip, $dbuser, $dbpassword, $dbname;
    $conn = new mysqli($dbip, $dbuser, $dbpassword, $dbname);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $stmt = $conn->prepare("SELECT p.title, p.description, p.picPath, p.created_at, p.likes, u.nickname, u.avatarPath FROM posts p JOIN users u ON p.authorID = u.id ORDER BY created_at DESC LIMIT 20 OFFSET ?;");
    $stmt->bind_param("i", $page);
    $stmt->execute();
    $result = $stmt->get_result();
    $posts = $result->fetch_all(MYSQLI_ASSOC);
    return $posts;
}

function checkToken($id)
{
    global $secretKey, $dbip, $dbuser, $dbpassword, $dbname;
    $conn = new mysqli($dbip, $dbuser, $dbpassword, $dbname);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();
    if ($result->num_rows > 0) {
        return true;
    } else {
        return false;
    }

}



