<?php
require_once __DIR__ . '/../config/database.php';
$token=$_GET['token']??'';$id=filter_input(INPUT_GET,'id',FILTER_VALIDATE_INT);
if(!$id||!preg_match('/^[a-f0-9]{48}$/',$token)){http_response_code(404);exit('Archivo no encontrado.');}
$stmt=$pdo->prepare('SELECT p.stored_name,p.original_name,p.mime_type,p.file_size FROM photos p JOIN albums a ON a.id=p.album_id WHERE p.id=? AND a.token=?');$stmt->execute([$id,$token]);$p=$stmt->fetch();
if(!$p){http_response_code(404);exit('Archivo no encontrado.');}
$path=dirname(__DIR__).'/storage/originals/'.$p['stored_name'];if(!is_file($path)){http_response_code(404);exit('Archivo no encontrado.');}
$name=preg_replace('/[^A-Za-z0-9._-]/','_',basename($p['original_name']));
header('Content-Type: '.$p['mime_type']);header('Content-Length: '.filesize($path));header('Content-Disposition: attachment; filename="'.$name.'"; filename*=UTF-8\'\''.rawurlencode($p['original_name']));header('X-Content-Type-Options: nosniff');header('Cache-Control: private, no-store');readfile($path);