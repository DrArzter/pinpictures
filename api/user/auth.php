<?php

require '../../vendor/autoload.php';

use Firebase\JWT\JWT;

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

$forbiddenChars = "#$%&卐‎  ";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $dataInput = json_decode(file_get_contents('php://input'), true);
    $type = sanitizeInput($dataInput['type']);
    if ($type === 'login') {
        $nickname = sanitizeInput($dataInput['nickname']);
        $password = sanitizeInput($dataInput['password']);
        $rememberMe = sanitizeInput($dataInput['rememberMe']) == "yes" ? true : false;
        if ($rememberMe) {
            $authTime = 30 * 60 * 60 * 24;
        } else {
            $authTime = 60 * 60 * 24;
        }
        $id = checkLogin($nickname, $password);
        if ($id) {
            $token = createToken($id, $authTime);
            setcookie('auth_token', $token, time() + $authTime, '/');
            echo json_encode(["status" => "success", "message" => "Authorization successful"]);
            exit;
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid login or password"]);
            http_response_code(401);
            exit;
        }
    } else if ($type === 'registration') {
        $nickname = sanitizeInput($dataInput['nickname']);
        $password = sanitizeInput($dataInput['password']);

        if (strpbrk($nickname, $forbiddenChars) || strpbrk($password, $forbiddenChars)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Nickname or password contains forbidden characters"]);
            exit;
        }
    
        if (strlen($nickname) > 255 || strlen($nickname) < 3) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Nickname must be between 3 and 255 characters"]);
            exit;
        }
    
        if (strlen($password) > 255 || strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Password must be between 6 and 255 characters"]);
            exit;
        }

        $data = registration($nickname, $password);

        if ($data["status"]) {
            $authTime = 60 * 60 * 24;
            $token = createToken($data["id"], $authTime);
            setcookie('auth_token', $token, time() + $authTime, '/');
            echo json_encode(["status" => "success", "message" => "Registration successful"]);
            exit;
        } else {
            echo json_encode(["status" => "error", "message" => $data["message"]]);
            exit;
        }
    }
}

function registration($nickname, $password)
{
    global $dbip, $dbuser, $dbpassword, $dbname;
    $conn = new mysqli($dbip, $dbuser, $dbpassword, $dbname);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $stmt_check = $conn->prepare("SELECT * FROM users WHERE nickname = ?");
    $stmt_check->bind_param("s", $nickname);
    $stmt_check->execute();
    $result_check = $stmt_check->get_result();

    if ($result_check->num_rows > 0) {
        return ["status" => false, "message" => "Nickname already exists"];
    }

    $default_avatar_path = "default_avatar.png";

    $stmt_insert = $conn->prepare("INSERT INTO users (nickname, passwd, avatarPath) VALUES (?, ?, ?)");
    $hashed_password = password_hash($password, PASSWORD_BCRYPT);
    $stmt_insert->bind_param("sss", $nickname, $hashed_password, $default_avatar_path);

    if ($stmt_insert->execute()) {
        $id = $stmt_insert->insert_id;
        $stmt_insert->close();
        $conn->close();
        return ["status" => true, "message" => "Registration successful", "id" => $id];
    } else {
        $stmt_insert->close();
        $conn->close();
        return ["status" => false, "message" => "Error during registration"];
    }
}

function checkLogin($nickname, $password)
{
    global $dbip, $dbuser, $dbpassword, $dbname;
    $conn = new mysqli($dbip, $dbuser, $dbpassword, $dbname);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $stmt = $conn->prepare("SELECT id, passwd FROM users WHERE nickname = ?");
    $stmt->bind_param("s", $nickname);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user_data = $result->fetch_assoc();
        $hashed_password = $user_data['passwd'];

        if (password_verify($password, $hashed_password)) {
            $conn->close();
            return $user_data['id'];
        } else {
            $conn->close();
            return false;
        }
    } else {
        $conn->close();
        return false;
    }
}

function createToken($userId, $authTime)
{
    global $secretKey;
    $tokenPayload = [
        "iss" => "WebChat",
        "sub" => $userId,
        "iat" => time(),
        "exp" => time() + $authTime
    ];
    $token = JWT::encode($tokenPayload, $secretKey, 'HS256');
    return $token;
}