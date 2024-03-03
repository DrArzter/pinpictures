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

function sanitizeInput($input)
{
    return $input !== null ? htmlspecialchars($input, ENT_QUOTES, 'UTF-8') : '';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_COOKIE['auth_token'])) {
        http_response_code(401);
    }
    $post = json_decode(file_get_contents('php://input'), true);
    $title = sanitizeInput($post['title']);
    $description = sanitizeInput($post['description']);
    $picture = sanitizeInput($post['picture']);
    $status = createPost($title, $description, $picture);
    echo $status;
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $page = (intval(sanitizeInput($_GET['page'])) - 1) * 20;
    $posts = getPosts($page);
    echo json_encode($posts);
    exit;
}

function getPosts($page)
{
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

function createPost($title, $description, $picture)
{
    global $dbip, $dbuser, $dbpassword, $dbname;
    $conn = new mysqli($dbip, $dbuser, $dbpassword, $dbname);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $allowedExtensions = array('jpg', 'jpeg', 'png', 'gif', 'svg');
    $fileExtension = strtolower(pathinfo($_FILES['picture']['name'], PATHINFO_EXTENSION));

    if (!in_array($fileExtension, $allowedExtensions)) {
        return json_encode(["status" => "error", "message" => "Invalid file type"]);
    }

    $stmt = $conn->prepare("INSERT INTO posts (title, description, picture) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $title, $description, $picture);
    $stmt->execute();
    $id = $stmt->insert_id;
    $image = "$id.png";
    move_uploaded_file($_FILES['picture']['tmp_name'], "storage/imgs/$image");
    $stmt->close();
    $stmt = $conn->prepare("UPDATE posts SET picture = ? WHERE id = ?");
    $stmt->bind_param("si", $image, $id);
    $stmt->execute();
    if ($stmt->affected_rows > 0) {
        return json_encode(["status" => "success", "message" => "Post created successfully"]);
    } else {
        return json_encode(["status" => "error", "message" => "Unknown error"]);
    }
}

