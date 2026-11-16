<?php
require_once __DIR__ . '/../config/database.php';
$token=$_GET['token']??'';$id=filter_input(INPUT_GET,'id',FILTER_VALIDATE_INT);
if(!$id||!preg_match('/^[a-f0-9]{48}$/',$token)){http_response_code(404);exit;}
$stmt=$pdo->prepare('SELECT p.stored_name,p.mime_type FROM photos p JOIN albums a ON a.id=p.album_id WHERE p.id=? AND a.token=?');$stmt->execute([$id,$token]);$p=$stmt->fetch();
if(!$p){http_response_code(404);exit;}
$path=dirname(__DIR__).'/storage/originals/'.$p['stored_name'];if(!is_file($path)){http_response_code(404);exit;}
header('Content-Type: '.$p['mime_type']);header('Content-Length: '.filesize($path));header('X-Content-Type-Options: nosniff');header('Cache-Control: private, max-age=3600');readfile($path);