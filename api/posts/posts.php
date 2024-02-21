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