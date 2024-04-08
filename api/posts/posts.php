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
    if (!$token) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }
    $payload = JWT::decode($token, new Key($secretKey, 'HS256'));
    $id = sanitizeInput($payload->sub);
    $dataInput = json_decode(file_get_contents('php://input'), true);

    if (!empty($_POST['type'])) {
        $type = sanitizeInput($_POST['type']);
    } else {
        $type = sanitizeInput($dataInput['type']);
    }

    if ($type === 'createPost') {
        if (checkToken($id)) {
            $postTitle = sanitizeInput($_POST['title']);
            $postDesctiprion = sanitizeInput($_POST['description']);
            $image = $_FILES['image'];
            echo createPost($postTitle, $id, $postDesctiprion, $image);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
            exit;
        }
    } else if ($type === 'createComment') {
        if (checkToken($id)) {
            $postID = sanitizeInput($_POST['postID']);
            $comment = sanitizeInput($_POST['comment']);
            echo createComment($id, $postID, $comment);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
            exit;
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $token = isset($_COOKIE['auth_token']) ? sanitizeInput($_COOKIE['auth_token']) : false;
    if (!$token) {
        $id = 0;
    } else {
        $payload = JWT::decode($token, new Key($secretKey, 'HS256'));
        $id = $payload->sub;
    }

    $page = (intval(sanitizeInput($_GET['page'])) - 1) * 20;
    $posts = getPosts($page, $id);
    echo json_encode($posts);
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $token = isset($_COOKIE['auth_token']) ? sanitizeInput($_COOKIE['auth_token']) : false;
    if (!$token) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }
    $payload = JWT::decode($token, new Key($secretKey, 'HS256'));
    $id = sanitizeInput($payload->sub);

    $dataInput = json_decode(file_get_contents('php://input'), true);

    $type = sanitizeInput($dataInput['type']);
    $postID = sanitizeInput($dataInput['postID']);
    
    if ($type === 'likePost') {
        if (checkToken($id)) {
            echo likePost($id, $postID);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
    }
}

function createComment($userID, $postID, $comment)
{
    global $secretKey, $dbip, $dbuser, $dbpassword, $dbname;
    $conn = new mysqli($dbip, $dbuser, $dbpassword, $dbname);
    $stmt = $conn->prepare("INSERT INTO comments (userID, postID, comment) VALUES (?, ?, ?)");
    $stmt->bind_param("iis", $userID, $postID, $comment);
    $stmt->execute();
    if ($stmt->affected_rows > 0) {
        $stmt->close();
        return json_encode(['status' => 'success', 'message' => 'Comment added successfully']);
    } else {
        $stmt->close();
        return json_encode(['status' => 'error', 'message' => 'Failed to add comment']);
    }
}

function likePost($userID, $postID)
{
    global $secretKey, $dbip, $dbuser, $dbpassword, $dbname;
    $conn = new mysqli($dbip, $dbuser, $dbpassword, $dbname);
    $stmt = $conn->prepare("SELECT * FROM likes WHERE userID = ? AND postID = ?");
    $stmt->bind_param("ii", $userID, $postID);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $stmt = $conn->prepare("DELETE FROM likes WHERE userID = ? AND postID = ?");
        $stmt->bind_param("ii", $userID, $postID);
        $stmt->execute();
        $stmt->close();
        $stmt = $conn->prepare("SELECT * FROM likes WHERE postID = ?");
        $stmt->bind_param("i", $postID);
        $stmt->execute();
        $result = $stmt->get_result();
        return json_encode(['status' => 'success', 'message' => 'Post unliked', 'likes' => $result->num_rows]);
    } else {
        $stmt = $conn->prepare("INSERT INTO likes (userID, postID) VALUES (?, ?)");
        $stmt->bind_param("ii", $userID, $postID);
        $stmt->execute();
        $stmt->close();
        $stmt = $conn->prepare("SELECT * FROM likes WHERE postID = ?");
        $stmt->bind_param("i", $postID);
        $stmt->execute();
        $result = $stmt->get_result();
        return json_encode(['status' => 'success', 'message' => 'Post liked', 'likes' => $result->num_rows]);
    }
}

function createPost($title, $authorID, $description, $image)
{
    global $secretKey, $dbip, $dbuser, $dbpassword, $dbname;
    $conn = new mysqli($dbip, $dbuser, $dbpassword, $dbname);

    $permittedFiles = array('png', 'jpg', 'jpeg', 'webp');
    $ext = pathinfo($image['name'], PATHINFO_EXTENSION);

    if (!in_array($ext, $permittedFiles)) {
        return json_encode(["status" => "error", "message" => "Invalid file type"]);
    }

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $stmt = $conn->prepare("INSERT INTO posts (authorID, title, description) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $authorID, $title, $description);
    $stmt->execute();
    $id = sanitizeInput($stmt->insert_id);
    $image = "$id.png";
    $stmt->close();

    if ($_FILES['image']['error'] == UPLOAD_ERR_OK) {
        move_uploaded_file($_FILES['image']['tmp_name'], "../../storage/imgs/$image");
    } else {
        return json_encode(["status" => "error", "message" => "File upload failed"]);
    }

    $stmt = $conn->prepare("UPDATE posts SET picPath = ? WHERE id = ?");
    $stmt->bind_param("si", $image, $id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        return json_encode(["status" => "success", "message" => "Post created successfully"]);
    } else {
        return json_encode(["status" => "error", "message" => "Unknown error"]);
    }
}

function getPosts($page, $id)
{   
    global $secretKey, $dbip, $dbuser, $dbpassword, $dbname;
    $conn = new mysqli($dbip, $dbuser, $dbpassword, $dbname);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    
    $stmt = $conn->prepare("
        SELECT 
            p.id, 
            p.title, 
            p.description, 
            p.picPath, 
            p.created_at, 
            COUNT(l.userID) AS likes_count, 
            u.nickname, 
            u.avatarPath,
            CASE WHEN EXISTS (
                SELECT 1 FROM likes l2 WHERE l2.postID = p.id AND l2.userID = ?
            ) THEN true ELSE false END AS liked_by_user
        FROM 
            posts p 
            JOIN users u ON p.authorID = u.id 
            LEFT JOIN likes l ON p.id = l.postID 
        GROUP BY 
            p.id 
        ORDER BY 
            p.created_at DESC 
        LIMIT 20 OFFSET ?;
    ");
    
    $stmt->bind_param("ii", $id, $page);
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
